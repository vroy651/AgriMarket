from rest_framework import serializers
from .models import Product, Category, ProductImage, Order
from django.core.exceptions import ValidationError
from django.db.models import Q
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger(__name__)

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "city", "state", "address", "phone")


def validate_image(image_file):
    """Validate uploaded image file."""
    # Check file size (limit to 5MB)
    if image_file.size > 5 * 1024 * 1024:
        raise ValidationError("Image file too large ( > 5MB )")

        # Validate image format
    try:
        from PIL import Image

        img = Image.open(image_file)
        if img.format.upper() not in ["JPEG", "PNG", "WEBP"]:
            raise ValidationError("Unsupported image format")
        # Validate dimensions
        if img.width > 4096 or img.height > 4096:
            raise ValidationError("Image dimensions too large")

        # Ensure image is closed after validation
        img.close()

    except Exception as e:
        raise ValidationError(f"Invalid image file: {str(e)}")


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "product_count"]
        read_only_fields = ["slug", "product_count"]

    def get_product_count(self, obj):
        return obj.products.count()


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image"]


class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, required=False, read_only=True)
    seller = serializers.ReadOnlyField(source="seller.username")
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), write_only=True, source="category"
    )

    class Meta:
        model = Product
        fields = [
            "id",
            "seller",
            "category",
            "category_id",
            "name",
            "slug",
            "description",
            "price",
            "stock",
            "unit",
            "is_available",
            "views",
            "created_at",
            "updated_at",
            "images",
        ]
        read_only_fields = [
            "id",
            "seller",
            "slug",
            "views",
            "created_at",
            "updated_at",
            "images",
        ]

    def validate(self, data):
        name = data.get("name")
        category = None

        # Determine category from category_id or existing instance
        if "category" in data:
            category = data["category"]
        elif "category_id" in self.initial_data:
            try:
                category = Category.objects.get(pk=self.initial_data["category_id"])
            except Category.DoesNotExist:
                raise ValidationError({"category_id": "Invalid category ID."})

        if category is None:
            raise ValidationError({"category_id": "This field is required."})

        seller = self.context["request"].user

        # For create operation
        if not self.instance:
            existing_product = Product.objects.filter(
                Q(name__iexact=name) & Q(category=category) & Q(seller=seller)
            ).first()

            if existing_product:
                raise ValidationError(
                    {
                        "name": "You already have a product with this name in this category"
                    }
                )

        # For update operation
        elif self.instance:
            existing_product = (
                Product.objects.filter(
                    Q(name__iexact=name) & Q(category=category) & Q(seller=seller)
                )
                .exclude(id=self.instance.id)
                .first()
            )

            if existing_product:
                raise ValidationError(
                    {
                        "name": "You already have a product with this name in this category"
                    }
                )

        return data

    def create(self, validated_data):
        # category is already in validated_data due to 'source' in category_id
        product = Product.objects.create(**validated_data)
        return product

    def update(self, instance, validated_data):
        # Handle images separately
        images_data = validated_data.pop("images", [])

        # Update the product instance
        instance = super().update(instance, validated_data)

        # Update or create images
        for image_data in images_data:
            if "id" in image_data:
                try:
                    image = ProductImage.objects.get(pk=image_data["id"])
                    image_serializer = ProductImageSerializer(image, data=image_data)
                    if image_serializer.is_valid(raise_exception=True):
                        image_serializer.save()
                except ProductImage.DoesNotExist:
                    pass  # Handle case where image ID doesn't exist
            else:
                ProductImage.objects.create(product=instance, **image_data)

        return instance


class OrderSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "product_id",
            "quantity",
            "total_price",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["total_price", "status"]

    def validate(self, data):
        logger.debug(f"Validating order data: {data}")

        try:
            product_id = data.get("product_id")
            quantity = data.get("quantity")

            if not product_id:
                raise serializers.ValidationError(
                    {"product_id": "This field is required"}
                )

            if not quantity:
                raise serializers.ValidationError(
                    {"quantity": "This field is required"}
                )

            if quantity <= 0:
                raise serializers.ValidationError(
                    {"quantity": "Quantity must be greater than 0"}
                )

            try:
                product = Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                raise serializers.ValidationError(
                    {"product_id": f"Product with id {product_id} not found"}
                )

            if not product.is_available:
                raise serializers.ValidationError(
                    {"product_id": "Product is not available"}
                )

            if quantity > product.stock:
                raise serializers.ValidationError(
                    {"quantity": f"Only {product.stock} units available"}
                )

            # Store product instance for later use
            data["product"] = product
            return data

        except Exception as e:
            logger.error(f"Validation error in OrderSerializer: {str(e)}")
            raise
