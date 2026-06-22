from django.urls import path
from .views import SettingsView, AlbomsView, edit_profile

urlpatterns = [
    path('settings/', edit_profile, name='settings'),
    path(route= "alboms/", view = AlbomsView.as_view(), name = "alboms")
]
