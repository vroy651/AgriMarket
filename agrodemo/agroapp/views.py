from django.shortcuts import render,redirect,get_object_or_404
from django.contrib.auth.decorators import login_required
from .forms import RegistrationForm, PostForm
from django.contrib.auth import login, logout, authenticate
from .models import Post
# Create your views here.



@login_required(login_url='/login')
def home(request):
    posts = Post.objects.all()
    
    if request.method == "POST":
        post_id = request.POST.get('post-id')  # Use POST to retrieve the 'post-id'
        if post_id:
            post_to_delete = get_object_or_404(Post, id=post_id)
            post_to_delete.delete()  # Delete the specified post
            return redirect('home')  # Redirect back to the home page
    
    return render(request, 'agroapp/home.html', {'posts': posts})

@login_required(login_url='/login')
def create_post(request):
    if request.method == 'POST':
        form = PostForm(request.POST)

        if form.is_valid():
            post=form.save(commit=False)

            post.author = request.user

            post.save()
            return redirect('/home')
    else:
        form = PostForm()
    
    return render(request,"agroapp/create_post.html",{'form':form})


def sign_up(request):
    if request.method == "POST":
        form=RegistrationForm(request.POST)

        if form.is_valid():
            user=form.save()
            login(request,user)

            return redirect('/home')

    else:
        form= RegistrationForm()
    

    return render(request,"registration/signup.html",{'form':form})