from django.urls import path

from .consumers import PresenceConsumer

websocket_urlpatterns = [
    path('presence/', PresenceConsumer.as_asgi()),
]
