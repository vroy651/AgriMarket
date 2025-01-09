from django.contrib import admin
from .models import Category,Product,ProductImage, Order, ProductView, Notification,Review
# Register your models here.

admin.site.register(Category)
admin.site.register(Product)
admin.site.register(ProductImage)
admin.site.register(Order)
admin.site.register(ProductView)
admin.site.register(Review)
admin.site.register(Notification)