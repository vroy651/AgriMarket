from django.db import models
from django.contrib.auth.models import AbstractUser, User

# class UserProfile(models.Model):
#     user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
#     is_seller = models.BooleanField(default=False)

#     def __str__(self):
#         return self.user.username

class CustomUser(AbstractUser):

    city= models.CharField(max_length=100, blank=True,null=True)
    state= models.CharField(max_length=100,blank=True,null=True)
    address= models.TextField(blank=True,null=True)
    phone=models.CharField(max_length=50,blank=True,null=True)
    is_seller = models.BooleanField(default=False)

    def __str__(self):
        return self.username