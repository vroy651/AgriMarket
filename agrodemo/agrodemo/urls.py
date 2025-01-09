from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.documentation import include_docs_urls
from rest_framework.permissions import AllowAny

from django.shortcuts import render

def custom_404(request, exception):
    return render(request, '404.html', status=404)

def custom_500(request):
    return render(request, '500.html', status=500)

handler404 = custom_404
handler500 = custom_500

# API Documentation settings
API_TITLE = 'FarmLand AI API'
API_DESCRIPTION = 'API endpoints for FarmLand AI agricultural platform'

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    # API endpoints
    path('api/v1/', include([
        path('users/', include('users.urls')),
        path('marketplace/', include('marketplace.urls', namespace='marketplace')),
        path('store/', include('store.urls')),
    ])),
    
    # API Documentation
    path('api/docs/', include_docs_urls(
        title=API_TITLE,
        description=API_DESCRIPTION,
        permission_classes=[AllowAny]
    )),
    
    # Authentication
    # path('api-auth/', include('rest_framework.urls')),  # DRF browsable API authentication
    # path('', include('django.contrib.auth.urls')),  # Django authentication views
]

# Debug toolbar (only in debug mode)
if settings.DEBUG:
    try:
        import debug_toolbar
        urlpatterns = [
            path('__debug__/', include(debug_toolbar.urls)),
        ] + urlpatterns
    
    except Exception as e:
        raise e

# Media files serving in development
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Static files serving in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Handle 404 and 500 errors
def custom_404(request, exception):
    return render(request, '404.html', status=404)

def custom_500(request):
    return render(request, '500.html', status=500)

handler404 = custom_404
handler500 = custom_500
