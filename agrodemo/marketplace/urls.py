from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views 
from .views import ProductSearchView

app_name = 'marketplace'

# Initialize the router
router = DefaultRouter()

# Register ViewSets
router.register(r'products', views.ProductViewSet, basename='product')
router.register(r'orders', views.OrderViewSet, basename='order')
router.register(r'categories', views.CategoryViewSet, basename='category')
# router.register(r'search', views.ProductSearchView ,basename='search')

# URL patterns
urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
    path('search/', ProductSearchView.as_view(), name='search'),
#     Product-related custom endpoints
    path('my-products/',
         views.ProductViewSet.as_view({'get': 'my_products'}),
         name='my_products'),

#     path('products/<slug:slug>/images/<int:image_id>/delete/',
#          views.ProductViewSet.as_view({'delete': 'delete_image'}),
#          name='delete_product_image'),

    # Order-related custom endpoints
    path('seller-orders/',
         views.OrderViewSet.as_view({'get': 'seller_orders'}),
         name='seller_orders'),
    path('order/<int:pk>/confirm/',
         views.OrderViewSet.as_view({'post': 'confirm'}),
         name='confirm_order'),
    path('order/<int:pk>/cancel/',
         views.OrderViewSet.as_view({'post': 'cancel'}),
         name='cancel_order'),

    # Weather and agricultural data endpoints
    path('weather/',
         views.weather_view,
         name='weather'),

    path('crop-calendar/',
         views.crop_calendar_view,
         name='crop_calendar'),

    path('market-prices/',
         views.market_prices_view,
         name='market_prices'),

    path('pest-disease-tracker/',
         views.pest_disease_tracker_view,
         name='pest_tracker'),

    # Authentication endpoints
    path('signup/',
         views.SignUpView.as_view(),
         name='signup'),

    path('login/',
         views.LoginView.as_view(),
         name='login'),

    path('user/',
          views.UserView.as_view(),
          name='user_detail'),  # For GET, POST, PUT, DELETE on the user

]