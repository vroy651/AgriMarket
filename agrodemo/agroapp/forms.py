from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm
from .models import Post

class RegistrationForm(UserCreationForm):
    email=forms.EmailField(required=True)
    first_name=forms.CharField(max_length=255,required=True)

    class Meta:
        model=User
        fields = ['username','email','first_name','password1','password2']

class PostForm(forms.ModelForm):

    class Meta:
        model = Post
        fields = ['title','description']