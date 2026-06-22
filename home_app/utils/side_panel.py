from django.db.models import CharField, DateTimeField, OuterRef, Subquery

from chat_app.models import Chat, Message
from chat_app.utils.chat_queries import get_chat_unread_count, get_new_messages_count
from post_app.models import Post, PostView
from user_app.utils.friend_queries import get_users_by_section


def get_user_avatar(user):
    profile = getattr(user, 'profile', None)
    if profile and profile.avatar:
        return profile.avatar.url
    return None


def get_profile_stats(user):
    friends_count = get_users_by_section(user, 'friends').count()
    posts_count = Post.objects.filter(author=user).count()
    readers_count = (
        PostView.objects
        .filter(post__author=user)
        .values('user')
        .distinct()
        .count()
    )

    return {
        'posts_count': posts_count,
        'friends_count': friends_count,
        'readers_count': readers_count,
    }


def get_friend_requests_count(user):
    return get_users_by_section(user, 'requests').count()


def get_friend_requests(user, limit=3):
    requests = (
        get_users_by_section(user, 'requests')
        .select_related('profile')[:limit]
    )

    return [
        {
            'id': request_user.id,
            'username': request_user.username,
            'full_name': f'{request_user.first_name} {request_user.last_name}'.strip(),
            'avatar': get_user_avatar(request_user),
        }
        for request_user in requests
    ]


def get_recent_messages(user, limit=3):
    last_message = Message.objects.filter(
        chat=OuterRef('pk')
    ).order_by('-created_at')

    chats = (
        Chat.objects
        .filter(users=user, is_group=False)
        .prefetch_related('users__profile')
        .annotate(
            last_message_text=Subquery(
                last_message.values('text')[:1],
                output_field=CharField(),
            ),
            last_message_time=Subquery(
                last_message.values('created_at')[:1],
                output_field=DateTimeField(),
            ),
        )
        .exclude(last_message_time__isnull=True)
        .order_by('-last_message_time')[:limit]
    )

    recent_messages = []

    for chat in chats:
        other_user = next(
            (chat_user for chat_user in chat.users.all() if chat_user.id != user.id),
            None,
        )
        if not other_user:
            continue

        recent_messages.append({
            'chat_id': chat.id,
            'user_id': other_user.id,
            'username': other_user.username,
            'avatar': get_user_avatar(other_user),
            'last_message': chat.last_message_text,
            'last_message_time': chat.last_message_time,
            'unread_count': get_chat_unread_count(chat, user),
        })

    return recent_messages


def get_side_panel_context(user):
    return {
        'profile_stats': get_profile_stats(user),
        'user_avatar': get_user_avatar(user),
        'friend_requests': get_friend_requests(user),
        'friend_requests_count': get_friend_requests_count(user),
        'recent_messages': get_recent_messages(user),
        'new_messages_count': get_new_messages_count(user),
    }
