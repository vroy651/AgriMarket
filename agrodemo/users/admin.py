from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser
# Register your models here.

class CustomUserAdmin(UserAdmin):

    add_fieldsets=(
        (None,{
            'classes': ('wide',),
            'fields': ('username','email','first_name','last_name','password1','password2','city','state','address','is_active','is_staff','phone',)
        }
         
         )
    )

admin.site.register(
    CustomUser,CustomUserAdmin
)