"""
    Файл для налаштування маршрутизації WebSocket-з`єднань.
    Цей файл є аналогом urls.py і працює в асинхронному режимі. 
    В цьому файлі ми створюємо url-адреси для WebSocket-з`єднань.
"""
from django.urls import path
from .consumers import ChatConsumer, NotificationConsumer

websocket_urlpatterns = [
    path(route= 'chat/<int:chat_id>/', view= ChatConsumer.as_asgi()),  # type: ignore
    path(route= 'notifications/', view= NotificationConsumer.as_asgi()),  # type: ignore
]