
from django.contrib.auth import get_user_model
from django.utils.text import slugify
from django.contrib.postgres.search import SearchVectorField, SearchVector, SearchRank, SearchQuery
from django.db.models import Q
from django.core.exceptions import ValidationError
from django.db import models, transaction
User = get_user_model()

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True, help_text="Category name")
    slug = models.SlugField(max_length=100, unique=True, blank=True,null=True)
    description = models.TextField(null=True,blank=True, help_text="Optional category description")
    created_at = models.DateTimeField(auto_now_add=True,null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True,null=True)

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

class Product(models.Model):
    UNIT_CHOICES = [
        ('kg', 'Kilograms'),
        ('g', 'Grams'),
        ('ton', 'Tons'),
        ('l', 'Liters'),
        ('d', "Dozen")
    ]

    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='products')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES, default='kg')
    is_available = models.BooleanField(default=True)
    views = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    search_vector = SearchVectorField(null=True, blank=True)  # New field for search

    class Meta:
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['created_at']),
            models.Index(fields=['is_available']),
        ]

    def save(self, *args, **kwargs):
        # Handle slug creation
        if not self.slug:
            self.slug = slugify(self.name)
            unique_slug = self.slug
            counter = 1
            while Product.objects.filter(slug=unique_slug).exists():
                unique_slug = f'{self.slug}-{counter}'
                counter += 1
            self.slug = unique_slug

        # First save without search vector
        self.search_vector = None  # Clear the search vector for initial save
        super().save(*args, **kwargs)
        
        # Now update the search vector after initial save
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE marketplace_product 
                SET search_vector = (
                    setweight(to_tsvector('english', COALESCE(%s, '')), 'A') ||
                    setweight(to_tsvector('english', COALESCE(%s, '')), 'B') ||
                    setweight(to_tsvector('english', COALESCE(%s, '')), 'C')
                )
                WHERE id = %s
                """,
                [self.name, self.description, self.category.name, self.pk]
            )
            
    # def save(self, *args, **kwargs):
    #     # Handle slug creation
    #     if not self.slug:
    #         self.slug = slugify(self.name)
    #         unique_slug = self.slug
    #         counter = 1
    #         while Product.objects.filter(slug=unique_slug).exists():
    #             unique_slug = f'{self.slug}-{counter}'
    #             counter += 1
    #         self.slug = unique_slug

    #     # First save to ensure we have an instance
    #     super().save(*args, **kwargs)

    #     # Update search vector
    #     Product.objects.filter(pk=self.pk).update(
    #         search_vector=SearchVector('name', weight='A') + 
    #                     SearchVector('description', weight='B') + 
    #                     SearchVector('category__name', weight='C')
    #     )

    @staticmethod
    def search(query, filters=None):
        """
        Comprehensive search method that combines full-text search with filtering

        Args:
            query (str): Search query string
            filters (dict): Optional filters like category, price range, availability

        Returns:
            QuerySet: Filtered and ordered product queryset
        """
        if not query and not filters:
            return Product.objects.filter(is_available=True)

        queryset = Product.objects.all()

        # Apply filters if provided
        if filters:
            if 'category' in filters:
                queryset = queryset.filter(category__slug=filters['category'])
            if 'min_price' in filters:
                queryset = queryset.filter(price__gte=filters['min_price'])
            if 'max_price' in filters:
                queryset = queryset.filter(price__lte=filters['max_price'])
            if 'availability' in filters:
                queryset = queryset.filter(is_available=filters['availability'])

        # If no search query, return filtered queryset
        if not query:
            return queryset.filter(is_available=True)

        # Try PostgreSQL full-text search first
        try:
            search_query = SearchQuery(query)
            search_rank = SearchRank('search_vector', search_query)

            queryset = queryset.annotate(
                rank=search_rank
            ).filter(
                search_vector=search_query,
                is_available=True
            ).order_by('-rank', '-created_at')

        except Exception:
            # Fallback to basic search if PostgreSQL search is unavailable
            queryset = queryset.filter(
                Q(name__icontains=query) |
                Q(description__icontains=query) |
                Q(category__name__icontains=query),
                is_available=True
            ).order_by('-created_at')

        return queryset

    def __str__(self):
        return self.name

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='product_images/') # You might use FileField

    def __str__(self):
        return f"Image for {self.product.name}"

class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.PositiveIntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review by {self.user.username} for {self.product.name}"

class ProductView(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='product_views')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    viewed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"View of {self.product.name} at {self.viewed_at}"

class Notification(models.Model):
    recipient = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"Notification for {self.recipient.username}"

class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sales')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        # Validation to check quantity is positive
        if self.quantity <= 0:
            raise ValidationError('Quantity must be a positive value.')

    def save(self, *args, **kwargs):
        self.clean()
        if self.total_price is None:
            self.total_price = self.quantity * self.product.price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order #{self.id} - {self.buyer.username}"

    @transaction.atomic
    def confirm_order(self):
        """Confirm the order if it's in pending status."""
        if self.status != 'pending':
            raise ValueError("Only pending orders can be confirmed")
        self.status = 'confirmed'
        self.save()

        # Create notification for buyer
        Notification.objects.create(
            recipient=self.buyer,
            message=f"Your order #{self.id} for {self.product.name} has been confirmed"
        )

    @transaction.atomic
    def cancel_order(self, reason=None):
        """Cancel the order and return stock to inventory."""
        if self.status not in ['pending', 'confirmed']:
            raise ValueError("Only pending or confirmed orders can be cancelled")

        try:
            # Return stock to inventory
            self.product.stock += self.quantity
            self.product.is_available = True
            self.product.save()
        except Exception as e:
            raise Exception(f"Failed to update product stock during cancellation: {e}")

        self.status = 'cancelled'
        self.save()

        # Create notifications
        cancel_message = f"Order #{self.id} has been cancelled"
        if reason:
            cancel_message += f": {reason}"

        Notification.objects.create(
            recipient=self.buyer,
            message=cancel_message
        )