from django.db import models
from django.conf import settings

# Create your models here.

class Post(models.Model):
    title = models.CharField(max_length=255)
    topic = models.CharField(max_length=100, null=True, blank=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='posts')
    tags = models.ManyToManyField('Tag', related_name="post_tags", blank=True)

    def __str__(self):
        return self.title
    
class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name
    
class PostLink(models.Model):
    post = models.ForeignKey(
        to = Post,
        on_delete= models.CASCADE,
        related_name= "links"
    )
    url = models.URLField(max_length= 500)

    def __str__(self):
        return f"Link: {self.url}"

class PostImage(models.Model):
    post = models.ForeignKey(
        to = Post,
        on_delete= models.CASCADE,
        related_name= "images"
    )
    original_image = models.ImageField(upload_to= "post_app/original_image/")
    compressed_image = models.ImageField(upload_to= "post_app/compressed_image/")
    
    def __str__(self):
        return f"Image: {self.original_image}"

class PostView(models.Model):
    user = models.ForeignKey(
        to= settings.AUTH_USER_MODEL,
        on_delete= models.CASCADE
    )
    post = models.ForeignKey(
        to= Post,
        on_delete= models.CASCADE,
        related_name= "views"
    )

class PostLike(models.Model):
    user = models.ForeignKey(
        to= settings.AUTH_USER_MODEL,
        on_delete= models.CASCADE
    )
    post = models.ForeignKey(
        to= Post,
        on_delete= models.CASCADE,
        related_name= "likes"
    )

class PostHeart(models.Model):
    user = models.ForeignKey(
        to= settings.AUTH_USER_MODEL,
        on_delete= models.CASCADE
    )
    post = models.ForeignKey(
        to= Post,
        on_delete= models.CASCADE,
        related_name= "hearts"
    )