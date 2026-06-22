from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.

class User(AbstractUser):
    username = models.CharField(
        max_length= 150,
        blank= True,
        null= True
    )
    
    email = models.EmailField(
        unique= True
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

class Friendship(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('dismissed', 'Dismissed'),
    ]

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='pending'
    )

    from_user = models.ForeignKey(
        User,
        related_name='sent_friendships',
        on_delete=models.CASCADE
    )

    to_user = models.ForeignKey(
        User,
        related_name='received_friendships',
        on_delete=models.CASCADE
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('from_user', 'to_user')

    def __str__(self):
        return f"{self.from_user} -> {self.to_user} ({self.status})"
