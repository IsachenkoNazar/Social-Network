from django.db.models import CharField, Count, DateTimeField, IntegerField, OuterRef, Subquery, Value
from django.db.models.functions import Coalesce
from django.core.paginator import Paginator

from chat_app.models import Chat, Message


def get_chat_unread_count(chat, user):
    return (
        Message.objects
        .filter(chat=chat)
        .exclude(sender=user)
        .exclude(readers=user)
        .count()
    )


def get_new_messages_count(user):
    return (
        Message.objects
        .filter(chat__users=user)
        .exclude(sender=user)
        .exclude(readers=user)
        .count()
    )


def get_chats_with_unread(user, is_group=False):
    last_message = Message.objects.filter(
        chat=OuterRef('pk')
    ).order_by('-created_at')

    unread_subquery = (
        Message.objects
        .filter(chat=OuterRef('pk'))
        .exclude(sender=user)
        .exclude(readers=user)
        .values('chat')
        .annotate(cnt=Count('id'))
        .values('cnt')[:1]
    )

    queryset = Chat.objects.filter(users=user, is_group=is_group)

    if not is_group:
        queryset = queryset.prefetch_related('users__profile')

    return queryset.annotate(
        last_message_text=Subquery(
            last_message.values('text')[:1],
            output_field=CharField(),
        ),
        last_message_has_images=Subquery(
            last_message.values('images__id')[:1],
            output_field=IntegerField(),
        ),
        last_message_time=Subquery(
            last_message.values('created_at')[:1],
            output_field=DateTimeField(),
        ),
        unread_count=Coalesce(
            Subquery(unread_subquery, output_field=IntegerField()),
            Value(0),
        ),
    ).order_by('-last_message_time', '-id')


def get_section_unread_count(chats):
    return sum(chat.unread_count for chat in chats)


def is_message_new(message, user):
    if message.sender_id == user.id:
        return False
    return not message.readers.filter(id=user.id).exists()


def serialize_message(message, user):
    return {
        'id': message.id,
        'sender': message.sender.username,
        'text': message.text,
        'images': [image.image.url for image in message.images.all()],
        'datetime': message.created_at.isoformat(),
        'is_new': is_message_new(message, user),
    }


def get_chat_messages(chat, user):
    return chat.messages.select_related('sender').prefetch_related('readers').order_by('created_at')


MESSAGES_PAGE_SIZE = 20


def get_chat_messages_page(chat, user, page=1, page_size=MESSAGES_PAGE_SIZE):
    queryset = (
        chat.messages
        .select_related('sender')
        .prefetch_related('images', 'readers')
        .order_by('-created_at')
    )
    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)
    messages = list(reversed(page_obj.object_list))

    return {
        'messages': [serialize_message(message, user) for message in messages],
        'has_older': page_obj.has_next(),
        'next_page': page_obj.next_page_number() if page_obj.has_next() else None,
        'page': page_obj.number,
    }


def mark_chat_as_read(chat, user):
    unread_messages = (
        Message.objects
        .filter(chat=chat)
        .exclude(sender=user)
        .exclude(readers=user)
    )

    for message in unread_messages:
        message.readers.add(user)


def _user_avatar(user):
    profile = getattr(user, 'profile', None)
    if profile and profile.avatar:
        return profile.avatar.url
    return None


def build_notification_payload(message, recipient):
    chat = message.chat
    personal_chats = list(get_chats_with_unread(recipient, is_group=False))
    group_chats = list(get_chats_with_unread(recipient, is_group=True))

    other_user = None
    if not chat.is_group:
        other_user = chat.users.exclude(id=recipient.id).first()

    unread_count = (
        0
        if message.sender_id == recipient.id
        else get_chat_unread_count(chat, recipient)
    )

    return {
        'type': 'chat_notification',
        'chat_id': chat.id,
        'is_group': chat.is_group,
        'user_id': other_user.id if other_user else None,
        'username': (
            chat.name
            if chat.is_group
            else (other_user.username if other_user else '')
        ),
        'avatar': (
            chat.avatar.url
            if chat.is_group and chat.avatar
            else _user_avatar(other_user)
        ),
        'last_message': message.text or ('Зображення' if message.images.exists() else ''),
        'last_message_time': message.created_at.isoformat(),
        'sender': message.sender.username,
        'unread_count': unread_count,
        'new_messages_count': get_new_messages_count(recipient),
        'personal_unread_count': get_section_unread_count(personal_chats),
        'group_unread_count': get_section_unread_count(group_chats),
    }


def build_notifications_for_message(message):
    chat = message.chat
    payloads = {}

    for user in chat.users.select_related('profile').all():
        payloads[user.id] = build_notification_payload(message, user)

    return payloads


def get_unread_status(user):
    personal_chats = list(get_chats_with_unread(user, is_group=False))
    group_chats = list(get_chats_with_unread(user, is_group=True))

    chats = []
    for chat in personal_chats + group_chats:
        other_user = None
        if not chat.is_group:
            other_user = chat.users.exclude(id=user.id).first()

        chats.append({
            'chat_id': chat.id, # type: ignore
            'is_group': chat.is_group,
            'user_id': other_user.id if other_user else None,
            'username': (
                chat.name
                if chat.is_group
                else (other_user.username if other_user else '')
            ),
            'avatar': (
                chat.avatar.url
                if chat.is_group and chat.avatar
                else _user_avatar(other_user)
            ),
            'last_message': (
                chat.last_message_text
                or ('Зображення' if chat.last_message_has_images else '')
            ), # type: ignore
            'last_message_time': (
                chat.last_message_time.isoformat() # type: ignore
                if chat.last_message_time # type: ignore
                else None
            ),
            'unread_count': chat.unread_count, # type: ignore
        })

    return {
        'new_messages_count': get_new_messages_count(user),
        'personal_unread_count': get_section_unread_count(personal_chats),
        'group_unread_count': get_section_unread_count(group_chats),
        'chats': chats,
    }
