from django.db import models

# Create your models here.

from django.conf import settings
from django.db import models


class Chat(models.Model):
    users = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='chats',
        verbose_name='Користувачі'
    )

    name = models.CharField(
        max_length=30,
        blank=True,
        null=True,
        verbose_name='Назва чату'
    )

    is_group = models.BooleanField(
        default=False,
        verbose_name='Груповий чат'
    )

    avatar = models.ImageField(
        upload_to='chat_avatars/',
        blank=True,
        null=True,
        verbose_name='Аватар'
    )

    admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='admin_chats',
        blank=True,
        null=True,
        verbose_name='Адміністратор'
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        if self.is_group:
            return self.name or f'Група #{self.pk}'

        return f'Особистий чат #{self.pk}'
    
class Message(models.Model):
    text = models.TextField(
        blank=True,
        null=True,
        verbose_name='Текст повідомлення'
    )

    chat = models.ForeignKey(
        'Chat',
        on_delete=models.CASCADE,
        related_name='messages',
        verbose_name='Чат'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата створення'
    )

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages',
        verbose_name='Відправник'
    )

    readers = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='read_messages',
        blank=True,
        verbose_name='Переглянули'
    )

    def __str__(self):
        return f'Повідомлення #{self.pk}'


class MessageImage(models.Model):
    image = models.ImageField(
        upload_to='message_images/',
        verbose_name='Зображення'
    )

    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name='Повідомлення'
    )

    def __str__(self):
        return f'Зображення #{self.pk} для повідомлення #{self.message.pk}'