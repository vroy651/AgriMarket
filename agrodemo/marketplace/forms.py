from django import forms
from .models import Product, Category, ProductImage
from django.utils.text import slugify
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError

from django.db import models
from django.contrib.auth import get_user_model

User=get_user_model()

class MultipleFileInput(forms.ClearableFileInput):
    allow_multiple_selected = True

class MultipleFileField(forms.FileField):
    def __init__(self, *args, **kwargs):
        kwargs.setdefault("widget", MultipleFileInput())
        super().__init__(*args, **kwargs)

    def clean(self, data, initial=None):
        single_file_clean = super().clean
        if isinstance(data, (list, tuple)):
            result = [single_file_clean(d, initial) for d in data]
        else:
            result = single_file_clean(data, initial)
        return result

class ProductForm(forms.ModelForm):
    name = forms.CharField(
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Enter product name',
            'minlength': '3',
            'maxlength': '100',
        }),
        help_text='Product name should be between 3 and 100 characters'
    )

    description = forms.CharField(
        widget=forms.Textarea(attrs={
            'class': 'form-control',
            'placeholder': 'Enter product description',
            'rows': 4,
            'minlength': '10',
        }),
        help_text='Minimum 10 characters required'
    )

    price = forms.DecimalField(
        widget=forms.NumberInput(attrs={
            'class': 'form-control',
            'placeholder': '0.00',
            'min': '0.01',
            'step': '0.01'
        }),
        validators=[
            MinValueValidator(0.01, message="Price must be greater than $0.01"),
            MaxValueValidator(999999.99, message="Price cannot exceed $999,999.99")
        ],
        help_text='Enter price in USD ($)'
    )

    stock = forms.IntegerField(
        widget=forms.NumberInput(attrs={
            'class': 'form-control',
            'placeholder': 'Enter stock quantity',
            'min': '0'
        }),
        validators=[
            MinValueValidator(0, message="Stock cannot be negative"),
            MaxValueValidator(999999, message="Stock cannot exceed 999,999 units")
        ],
        help_text='Enter available quantity'
    )

    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    seller = models.ForeignKey(User, on_delete=models.CASCADE)
    
    is_available = forms.BooleanField(
        required=False,
        widget=forms.CheckboxInput(attrs={
            'class': 'form-check-input',
            'role': 'switch'
        }),
        initial=True,
        help_text='Enable this to make the product visible in the marketplace'
    )

    additional_images = MultipleFileField(
        required=False,
        widget=MultipleFileInput(attrs={
            'class': 'form-control',
            'accept': 'image/*',
            'data-browse-label': 'Browse Images',
        }),
        help_text='You can select multiple images (Max 5 images, each max 5MB)'
    )

    class Meta:
        model = Product
        fields = ['name', 'category', 'description', 'price', 'stock', 'is_available','additional_images']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['category'].widget.attrs.update({
            'class': 'form-select',
            'id': 'category-select',
        })
        self.fields['category'].empty_label = "Select a category"

        for field_name, field in self.fields.items():
            field.widget.attrs.update({
                'aria-label': field.label,
            })

    def clean_additional_images(self):
        images = self.files.getlist('additional_images')
        errors = []
        if images:
            if len(images) > 5:
                errors.append(ValidationError("You can upload maximum 5 images"))

            for image in images:
                if image.size > 5 * 1024 * 1024:
                    errors.append(ValidationError(f"Image '{image.name}' is too large. Maximum size is 5MB"))

                if image.content_type not in ['image/jpeg', 'image/png', 'image/webp']:
                    errors.append(ValidationError(f"Image '{image.name}' is not in a valid format. Please use JPEG, PNG, or WEBP"))

        if errors:
            raise ValidationError(errors)
        return images

    def clean_price(self):
        price = self.cleaned_data.get('price')
        if price and len(str(price).split('.')[-1]) > 2:
            raise forms.ValidationError("Price cannot have more than 2 decimal places")
        return price

    def clean(self):
        cleaned_data = super().clean()
        name = cleaned_data.get('name')
        description = cleaned_data.get('description')

        if name and description and name.lower() in description.lower():
            self.add_error('description', "Description should not be just the product name")
        return cleaned_data

    def clean_name(self):
        name = self.cleaned_data.get('name')
        if name:
            slug = slugify(name)
            query = Product.objects.filter(slug=slug)
            if self.instance and self.instance.pk:
                query = query.exclude(pk=self.instance.pk)
            if query.exists():
                raise forms.ValidationError(
                    f"A product with the name '{name}' already exists. Please choose a different name."
                )
        return name

    def save(self, commit=True):
        instance = super().save(commit=False)
        instance.slug = instance.slug or slugify(instance.name)
        if commit:
            instance.save()
            for image in self.cleaned_data.get('additional_images', []):
                ProductImage.objects.create(product=instance, image=image)
        return instance

class ProductSearchForm(forms.Form):
    search_query = forms.CharField(
        required=False,
        label="Search",
        widget=forms.TextInput(attrs={'placeholder': 'Search products...'})
    )
    category = forms.ModelChoiceField(
        queryset=Category.objects.all(),
        required=False,
        empty_label="All Categories"
    )
    min_price = forms.DecimalField(required=False, label="Min Price")
    max_price = forms.DecimalField(required=False, label="Max Price")
    sort_by = forms.ChoiceField(
        required=False,
        choices=[
            ('price_low', 'Price (Low to High)'),
            ('price_high', 'Price (High to Low)'),
            ('newest', 'Newest First'),
            ('oldest', 'Oldest First'),
        ],
        widget=forms.Select(attrs={'class': 'ml-2'})
    )

class OrderForm(forms.Form):
    quantity = forms.DecimalField(
        min_value=0.01,
        max_digits=10,
        decimal_places=2,
        widget=forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'})
    )
    product_id = forms.IntegerField(widget=forms.HiddenInput())  # Add a hidden field for product ID

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # You might want to set initial value for product_id if needed

    def clean_quantity(self):
        quantity = self.cleaned_data['quantity']
        if quantity <= 0:
            raise forms.ValidationError("Quantity must be greater than 0")
        return quantity

    def clean(self):
        cleaned_data = super().clean()
        quantity = cleaned_data.get('quantity')
        product_id = cleaned_data.get('product_id')

        if quantity is not None and product_id is not None:
            try:
                product = Product.objects.get(pk=product_id)
                if not product.is_available:
                    self.add_error('product_id', "This product is currently not available.")
                elif quantity > product.stock:
                    self.add_error('quantity', f"Only {product.stock} units of this product are currently in stock.")
            except Product.DoesNotExist:
                self.add_error('product_id', "Invalid product selected.")
        return cleaned_data