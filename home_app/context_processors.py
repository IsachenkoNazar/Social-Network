from chat_app.utils.chat_queries import get_new_messages_count
from user_app.utils.friend_queries import get_users_by_section


def header_notifications(request):
    user = getattr(request, "user", None)
    if not user or not user.is_authenticated:
        return {
            "header_new_messages_count": 0,
            "header_friend_requests_count": 0,
        }

    return {
        "header_new_messages_count": get_new_messages_count(user),
        "header_friend_requests_count": get_users_by_section(user, "requests").count(),
    }
