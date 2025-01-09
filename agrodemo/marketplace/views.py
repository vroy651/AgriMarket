from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db.models import Q, F
from django.db import transaction
from django.core.cache import cache

# from django.conf import settings
from .models import Product, Category, ProductImage, Order, ProductView, Notification
from .serializers import (
    ProductSerializer,
    CategorySerializer,
    OrderSerializer,
    UserSerializer,
    ProductImageSerializer,
)
from .permissions import IsSellerOrReadOnly, IsOrderParticipant
import logging
import os
from dotenv import load_dotenv

# from PIL import Image
from datetime import datetime
import requests
from rest_framework.exceptions import ValidationError
import google.generativeai as genai
from .serializers import validate_image  # Import validate_image from serializers
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from rest_framework.parsers import MultiPartParser, FormParser

# Initialize logging
logger = logging.getLogger(__name__)
load_dotenv()

class ProductSearchView(APIView):
    # ... (rest of ProductSearchView remains the same)
    def get(self, request):
        try:
            # Log incoming request
            logger.debug(f"Search request received: {request.query_params}")

            # Get search parameters with defaults
            query = request.query_params.get("q", "")
            category = request.query_params.get("category")
            min_price = request.query_params.get("min_price")
            max_price = request.query_params.get("max_price")
            page = request.query_params.get("page", "1")
            page_size = request.query_params.get("page_size", "20")

            # Validate numeric parameters
            try:
                page = int(page)
                page_size = int(page_size)
                if min_price:
                    float(min_price)
                if max_price:
                    float(max_price)
            except ValueError:
                return Response(
                    {"message": "Invalid numeric parameter provided"},
                    status=status.HTTP_400_BAD_REQUEST,
                    content_type="application/json",
                )

            # Build filters
            filters = {}
            if category:
                filters["category"] = category
            if min_price:
                filters["min_price"] = float(min_price)
            if max_price:
                filters["max_price"] = float(max_price)

            # Perform search
            try:
                products = Product.search(query, filters)
            except Exception as e:
                logger.error(f"Search error: {str(e)}")
                return Response(
                    {"message": "Error performing search"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    content_type="application/json",
                )

            # Paginate results
            paginator = Paginator(products, page_size)

            try:
                page_obj = paginator.page(page)
            except Exception as e:
                logger.error(f"Pagination error: {str(e)}")
                return Response(
                    {"message": "Invalid page number"},
                    status=status.HTTP_400_BAD_REQUEST,
                    content_type="application/json",
                )

            # Prepare response data
            try:
                serializer = ProductSerializer(page_obj, many=True)
                response_data = {
                    "results": serializer.data,
                    "total": paginator.count,
                    "total_pages": paginator.num_pages,
                    "current_page": page,
                    "has_next": page_obj.has_next(),
                    "has_previous": page_obj.has_previous(),
                }
            except Exception as e:
                logger.error(f"Serialization error: {str(e)}")
                return Response(
                    {"message": "Error preparing response data"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    content_type="application/json",
                )

            # Log successful response
            logger.debug("Search completed successfully")

            return Response(
                response_data,
                status=status.HTTP_200_OK,
                content_type="application/json",
            )

        except Exception as e:
            logger.error(f"Unexpected error in search view: {str(e)}")
            return Response(
                {"message": "An unexpected error occurred"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content_type="application/json",
            )

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def test_image_upload(request):
    # ... (rest of test_image_upload remains the same)
    try:
        images_data = request.FILES.getlist("images")
        serialized_images = []
        for image_data in images_data:
            serializer = ProductImageSerializer(
                data={"image": image_data}
            )  # passing data with image key
            if serializer.is_valid(raise_exception=True):
                serialized_images.append(serializer.data)

        return Response(
            {"message": "Images serialized successfully", "images": serialized_images},
            status=status.HTTP_201_CREATED,
        )

    except Exception as e:
        logger.error(f"Image Test View error: {str(e)}")
        return Response(
            {"error": "Image Test View failed", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

class StandardResultsSetPagination(PageNumberPagination):
    # ... (rest of StandardResultsSetPagination remains the same)
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    # ... (rest of CategoryViewSet remains the same)
    queryset = Category.objects.all().order_by("name")
    serializer_class = CategorySerializer
    pagination_class = StandardResultsSetPagination

class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [IsSellerOrReadOnly]
    pagination_class = StandardResultsSetPagination
    lookup_field = "slug"
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        queryset = Product.objects.select_related(
            "category", "seller"
        ).prefetch_related("images")

        if self.action == "list":
            # Only filter for available products in list view
            queryset = queryset.filter(is_available=True)

            # Cache handling
            cache_key = f'product_list_{self.request.user.id if self.request.user.is_authenticated else "anonymous"}'
            cached_queryset = cache.get(cache_key)

            if cached_queryset is not None:
                return cached_queryset

            cache.set(cache_key, queryset, 60)  # Cache for 5 minutes

        return queryset

    @method_decorator(cache_page(60 * 5))  # Cache for 5 minutes
    def get(self, request):
        # ... (rest of get method remains the same)
        try:
            # Input validation
            query = request.query_params.get("q", "").strip()
            category = request.query_params.get("category")
            min_price = request.query_params.get("min_price")
            max_price = request.query_params.get("max_price")

            try:
                page = max(1, int(request.query_params.get("page", "1")))
                page_size = min(100, max(1, int(request.query_params.get("page_size", "20"))))
            except ValueError:
                raise ValidationError("Invalid pagination parameters")

            # Price validation
            if min_price and max_price and float(min_price) > float(max_price):
                raise ValidationError("Minimum price cannot be greater than maximum price")

            # Build filters
            filters = {}
            if category:
                if not Category.objects.filter(id=category).exists():
                    raise ValidationError("Invalid category")
                filters["category"] = category
            if min_price:
                filters["price__gte"] = float(min_price)
            if max_price:
                filters["price__lte"] = float(max_price)

            # Base queryset with optimization
            queryset = Product.objects.select_related('category', 'seller')\
                                    .prefetch_related('images')\
                                    .filter(is_available=True)

            # Apply search filters
            if query:
                queryset = queryset.filter(
                    Q(name__icontains=query) |
                    Q(description__icontains=query) |
                    Q(category__name__icontains=query)
                ).distinct()

            # Apply additional filters
            for key, value in filters.items():
                queryset = queryset.filter(**{key: value})

            # Pagination with error handling
            try:
                paginator = Paginator(queryset, page_size)
                products = paginator.page(page)
            except EmptyPage:
                products = paginator.page(paginator.num_pages)
            except PageNotAnInteger:
                products = paginator.page(1)

            serializer = ProductSerializer(products, many=True, context={'request': request})

            response_data = {
                "results": serializer.data,
                "total": paginator.count,
                "total_pages": paginator.num_pages,
                "current_page": products.number,
                "has_next": products.has_next(),
                "has_previous": products.has_previous(),
            }

            return Response(response_data)

        except ValidationError as e:
            logger.warning(f"Validation error in product search: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Unexpected error in product search: {str(e)}", exc_info=True)
            return Response(
                {"error": "An unexpected error occurred"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def list(self, request, *args, **kwargs):
        queryset = Product.objects.all()  # No filtering
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        # ... (rest of retrieve method remains the same)
        instance = self.get_object()

        # Track view in a transaction
        with transaction.atomic():
            ProductView.objects.create(
                product=instance,
                user=request.user if request.user.is_authenticated else None,
            )
            instance.views = F("views") + 1
            instance.save(update_fields=["views"])

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @transaction.atomic
    def perform_create(self, serializer):
        print("Request Data:", self.request.data)
        try:
            # Ensure 'seller' is not in validated_data to avoid conflicts
            serializer.save(seller=self.request.user)

            # Handle images AFTER the product is created
            product = serializer.instance  # Get the created product instance
            images_data = self.request.FILES.getlist('images')
            for image_data in images_data:
                try:
                    validate_image(image_data)
                    ProductImage.objects.create(product=product, image=image_data)
                except ValidationError as e:
                    logger.error(f"Image validation error: {str(e)}")
                    raise  # Re-raise to rollback the transaction

            logger.info(f"Product created successfully: {product.id}")

        except Exception as e:
            logger.error(f"Error creating product: {str(e)}")
            raise

    @action(detail=True, methods=["delete"], url_path="images/(?P<image_id>[0-9]+)")
    def delete_image(self, request, slug=None, image_id=None):
        # ... (rest of delete_image action remains the same)
        try:
            product = self.get_object()

            if not image_id:
                raise ValidationError({"image_id": "Image ID is required"})

            if product.seller != request.user:
                return Response(
                    {"error": "Not authorized to delete this image"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            image = get_object_or_404(ProductImage, id=image_id, product=product)
            image.delete()

            return Response(status=status.HTTP_204_NO_CONTENT)

        except Exception as e:
            logger.error(f"Error deleting product image: {str(e)}")
            return Response(
                {"error": "Failed to delete image"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get"])
    def my_products(self, request):
        # ... (rest of my_products action remains the same)
        products = Product.objects.filter(seller=request.user).order_by("-created_at")
        page = self.paginate_queryset(products)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

class OrderViewSet(viewsets.ModelViewSet):
    # ... (rest of OrderViewSet remains the same)
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, IsOrderParticipant]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = Order.objects.select_related(
            "buyer", "seller", "product"
        ).filter(Q(buyer=self.request.user) | Q(seller=self.request.user))

        # Add filtering by status if provided
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset.order_by('-created_at')

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # ... (rest of create action remains the same)
        try:
            
            product_id = request.data.get('product_id')
            print(request.data)
            print(product_id)
            logger.info(f"Attempting to create order for product ID: {product_id}")
            logger.info(f"Request data: {request.data}")
            # Validate product existence and access
            try:
                product = Product.objects.select_for_update().get(
                    id=product_id,
                    is_available=True
                )
                logger.info(f"Product found: {product.id}, is_available: {product.is_available}")
                # ... rest of your create logic
            except Product.DoesNotExist:
                logger.warning(f"Product with ID {product_id} not found or unavailable.")
                return Response(
                    {"error": "Product not found or unavailable"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Validate quantity
            try:
                quantity = int(request.data.get('quantity', 1))
                if quantity <= 0:
                    raise ValidationError("Quantity must be positive")
            except (TypeError, ValueError):
                raise ValidationError("Invalid quantity")

            # Business rule validations
            if request.user == product.seller:
                raise ValidationError("Cannot order your own product")

            if quantity > product.stock:
                raise ValidationError(f"Only {product.stock} units available")

            # Check if user has pending orders for this product
            existing_pending_order = Order.objects.filter(
                buyer=request.user,
                product=product,
                status__in=['pending', 'processing']
            ).exists()
            print(existing_pending_order)
            if existing_pending_order:
                raise ValidationError("You already have a pending order for this product")

            # Create order with proper calculations
            total_price = quantity * product.price
            order = Order.objects.create(
                buyer=request.user,
                seller=product.seller,
                product=product,
                quantity=quantity,
                total_price=total_price,
                status='pending'
            )
            # Update product stock
            product.stock -= quantity
            if product.stock == 0:
                product.is_available = False
            product.save()

            # Create notifications
            Notification.objects.create(
                recipient=product.seller,
                message=f"New order #{order.id} received for {product.name}",
                type='new_order',
                reference_id=order.id
            )

            # Send order confirmation email (commented out as email service isn't shown)
            # self.send_order_confirmation_email(order)

            serializer = self.get_serializer(order)
            logger.info(f"Order {order.id} created successfully by user {request.user.id}")

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except ValidationError as e:
            logger.warning(f"Validation error in order creation: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Error creating order: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to create order"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @action(detail=False, methods=["get"])
    def seller_orders(self, request):
        # ... (rest of seller_orders action remains the same)
        orders = self.get_queryset().filter(seller=request.user)
        page = self.paginate_queryset(orders)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=True, methods=["post"])
    def confirm(self, request, pk=None):
        # ... (rest of confirm action remains the same)
        try:
            order = self.get_object()

            # Only seller can confirm order
            if request.user != order.seller:
                return Response(
                    {"error": "Only the seller can confirm orders"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            order.confirm_order()
            serializer = self.get_serializer(order)
            return Response(serializer.data)

        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error confirming order: {str(e)}")
            return Response(
                {"error": "Failed to confirm order"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        # ... (rest of cancel action remains the same)
        try:
            order = self.get_object()
            reason = request.data.get("reason")

            # Only seller or buyer can cancel order
            if request.user not in [order.seller, order.buyer]:
                return Response(
                    {"error": "Only order participants can cancel orders"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            order.cancel_order(reason=reason)
            serializer = self.get_serializer(order)
            return Response(serializer.data)

        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error cancelling order: {str(e)}")
            return Response(
                {"error": "Failed to cancel order"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def pest_disease_tracker_view(request):
    # ... (rest of pest_disease_tracker_view remains the same)
    try:
        soil_image = request.FILES.get("soilImage")
        leaf_image = request.FILES.get("leafImage")

        if not (soil_image or leaf_image):
            return Response(
                {"error": "Please upload either a soil or leaf image"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            logger.error("Google API key not found")
            return Response(
                {"error": "Service configuration error"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        generation_config = {
            "temperature": 0.4,
            "top_p": 1,
            "top_k": 32,
            "max_output_tokens": 4096,
        }

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            model_name="gemini-pro-vision", generation_config=generation_config
        )

        image_parts = []
        prompt_parts = []

        if soil_image:
            soil_image_content = soil_image.read()
            image_parts.append(
                {"mime_type": soil_image.content_type, "data": soil_image_content}
            )
            prompt_parts.append(
                "Analyze the soil image for agricultural characteristics and health."
            )

        if leaf_image:
            leaf_image_content = leaf_image.read()
            image_parts.append(
                {"mime_type": leaf_image.content_type, "data": leaf_image_content}
            )
            prompt_parts.append("Identify plant diseases/pests and suggest treatments.")

        prompt = " ".join(prompt_parts)
        contents = [prompt] + image_parts

        response = model.generate_content(contents)
        response.resolve()

        if not response.text:
            return Response(
                {"error": "No analysis generated"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({"prediction_results": response.text})

    except Exception as e:
        logger.error(f"Error in pest/disease analysis: {str(e)}", exc_info=True)
        return Response(
            {"error": "Analysis failed", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

class WeatherService:
    # ... (rest of WeatherService remains the same)
    """Weather service integration."""

    def __init__(self):
        self.api_key = os.getenv("WEATHER_API_KEY")
        self.base_url = "https://api.weatherapi.com/v1"

    def get_weather(self, latitude, longitude):
        cache_key = f"weather_{latitude}_{longitude}"
        weather_data = cache.get(cache_key)

        if weather_data is None:
            try:
                response = requests.get(
                    f"{self.base_url}/current.json",
                    params={"key": self.api_key, "q": f"{latitude},{longitude}"},
                    timeout=5,
                )
                response.raise_for_status()
                weather_data = response.json()

                # Cache for 30 minutes
                cache.set(cache_key, weather_data, 1800)

            except requests.exceptions.RequestException as e:
                logger.error(f"Weather API error: {str(e)}")
                raise

        return weather_data

class MarketPriceService:
    # ... (rest of MarketPriceService remains the same)
    """Market price data integration."""

    def __init__(self):
        self.api_key = os.getenv("MARKET_PRICE_API_KEY")
        self.base_url = (
            "https://api.marketplace.org/v1"  # Replace with the actual API URL
        )

    def get_prices(self, commodity=None):
        cache_key = f'market_prices_{commodity or 'all'}'
        price_data = cache.get(cache_key)

        if price_data is None:
            try:
                params = {"key": self.api_key}
                if commodity:
                    params["commodity"] = commodity

                response = requests.get(
                    f"{self.base_url}/prices",  # Replace '/prices' with the correct endpoint
                    params=params,
                    timeout=5,
                )
                response.raise_for_status()
                price_data = response.json()

                # Cache for 1 hour
                cache.set(cache_key, price_data, 3600)

            except requests.exceptions.RequestException as e:
                logger.error(f"Market Price API error: {str(e)}")
                raise

        return price_data

def get_crop_calendar(latitude, longitude, month=None):
    # ... (rest of get_crop_calendar remains the same)
    """Generate crop calendar based on location and season."""
    current_month = month or datetime.now().month

    # This could be expanded to use a proper agricultural API
    # For now, using a basic seasonal mapping
    seasonal_crops = {
        "winter": ["Wheat", "Barley", "Peas"],
        "spring": ["Corn", "Soybeans", "Rice"],
        "summer": ["Tomatoes", "Peppers", "Cotton"],
        "fall": ["Pumpkins", "Sweet Potatoes", "Beans"],
    }

    # Basic season determination
    if current_month in [12, 1, 2]:
        season = "winter"
    elif current_month in [3, 4, 5]:
        season = "spring"
    elif current_month in [6, 7, 8]:
        season = "summer"
    else:
        season = "fall"

    return {
        "season": season,
        "recommended_crops": seasonal_crops[season],
        "month": current_month,
    }

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def weather_view(request):
    # ... (rest of weather_view remains the same)
    try:
        latitude = request.query_params.get("latitude")
        longitude = request.query_params.get("longitude")

        if not (latitude and longitude):
            return Response(
                {"error": "Latitude and longitude are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        weather_service = WeatherService()
        weather_data = weather_service.get_weather(latitude, longitude)

        return Response(weather_data)

    except Exception as e:
        logger.error(f"Weather view error: {str(e)}")
        return Response(
            {"error": "Failed to fetch weather data"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def market_prices_view(request):
    # ... (rest of market_prices_view remains the same)
    try:
        commodity = request.query_params.get("commodity")

        market_service = MarketPriceService()
        price_data = market_service.get_prices(commodity)

        return Response(price_data)

    except Exception as e:
        logger.error(f"Market prices view error: {str(e)}")
        return Response(
            {"error": "Failed to fetch market prices"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def crop_calendar_view(request):
    # ... (rest of crop_calendar_view remains the same)
    try:
        latitude = request.query_params.get("latitude")
        longitude = request.query_params.get("longitude")
        month = request.query_params.get("month")

        if not (latitude and longitude):
            return Response(
                {"error": "Latitude and longitude are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if month:
            try:
                month = int(month)
                if not 1 <= month <= 12:
                    raise ValueError
            except ValueError:
                return Response(
                    {"error": "Invalid month"}, status=status.HTTP_400_BAD_REQUEST
                )

        calendar_data = get_crop_calendar(latitude, longitude, month)
        return Response(calendar_data)

    except Exception as e:
        logger.error(f"Crop calendar view error: {str(e)}")
        return Response(
            {"error": "Failed to generate crop calendar"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

class SignUpView(APIView):
    # ... (rest of SignUpView remains the same)
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "User created successfully"}, status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    # ... (rest of LoginView remains the same)
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                    "user": UserSerializer(user).data,
                },
                status=status.HTTP_200_OK,
            )
        return Response(
            {"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
        )

class UserView(APIView):
    """
    View for managing user accounts.
    """

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.request.method == "POST":
            return [AllowAny()]  # Allow anyone to create a user
        return [IsAuthenticated()]  # Only authenticated users can access other methods

    def get(self, request, *args, **kwargs):
        """
        Retrieve the current user's details.
        """
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        """
        Create a new user account.
        """
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, *args, **kwargs):
        """
        Update the current user's details.
        """
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, *args, **kwargs):
        """
        Delete the current user's account.
        """
        request.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)