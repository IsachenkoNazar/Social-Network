from django.db import models
from django.contrib.auth.models import User

from Social_Network import settings


class Profile(models.Model):
    signature = models.ImageField(blank=True, null=True)
    birth_date = models.DateTimeField(auto_now= True)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete= models.CASCADE)
    avatar = models.ImageField(upload_to= "profile_app/profile_avatars", blank= True, null= True)
    pseudonym = models.CharField(max_length= 50)
    is_image_signature = models.BooleanField(default= True)
    is_text_signature = models.BooleanField(default= True)

class Album(models.Model):
    name = models.CharField(max_length= 100, blank=True, null=True)
    theme = models.CharField(max_length= 50)
    year = models.DateField(auto_now= True)
    created_at = models.DateTimeField(auto_now= True)
    is_shown = models.BooleanField(default= False)
    is_default = models.BooleanField(default = True)
    profile = models.ForeignKey(to= "Profile", blank= True, on_delete= models.CASCADE)


class AlbumImage(models.Model):
    image = models.ImageField(upload_to= "profile_app/image", blank= True, null= True)
    created_at = models.DateTimeField(auto_now= True)
    is_shown = models.BooleanField(default= False)
    album= models.ForeignKey(Album, on_delete= models.CASCADE)