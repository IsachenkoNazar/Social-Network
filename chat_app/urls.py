from django.urls import path
from .views import (
    ChatView,
    ChatActionView,
    ChatUnreadStatusView,
    ContactsPaginationView,
    ChatMessageUploadView,
    ChatWithView,
    CreateGroupview,
    GroupHistoryView,
    MarkChatReadView,
)

urlpatterns = [
    path(route= '', view= ChatView.as_view(), name= 'chat'),
    path(route= "contacts/", view= ContactsPaginationView.as_view(), name= "contacts-pagination"),
    path(route= "chat_with/<int:user_id>/", view= ChatWithView.as_view(), name= "chat_with"),
    path(route= "create_group/", view= CreateGroupview.as_view(), name= "create_group"),
    path(route= "chat_history/<int:chat_id>/", view= GroupHistoryView.as_view(), name= "chat_history"),
    path(route= "mark_read/<int:chat_id>/", view= MarkChatReadView.as_view(), name= "mark_chat_read"),
    path(route= "message_upload/<int:chat_id>/", view= ChatMessageUploadView.as_view(), name= "chat_message_upload"),
    path(route= "chat_action/<int:chat_id>/", view= ChatActionView.as_view(), name= "chat_action"),
    path(route= "unread_status/", view= ChatUnreadStatusView.as_view(), name= "chat_unread_status"),
    path("contacts-modal/", ContactsPaginationView.as_view(), name="contacts_modal")
]
