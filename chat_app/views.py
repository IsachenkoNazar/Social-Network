from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404
from django.views.generic import TemplateView , FormView, View
from django.contrib.auth.mixins import LoginRequiredMixin
from django.core.paginator import Paginator
from django.template.loader import render_to_string
from django.contrib.auth import get_user_model
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Chat, Message, MessageImage
from user_app.utils.friend_queries import get_users_by_section
from user_app.utils.online_status import get_online_user_ids
from .utils.chat_queries import (
    build_notifications_for_message,
    get_chat_messages_page,
    get_chats_with_unread,
    get_section_unread_count,
    get_unread_status,
    mark_chat_as_read,
    serialize_message,
)
from .forms import MessageForm
# Create your views here.

User = get_user_model()

class ChatView(LoginRequiredMixin, TemplateView):
    template_name = "chat_app/chat.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        contacts_qs = (
            get_users_by_section(self.request.user, "friends")
            .order_by("username")
        )

        paginator = Paginator(contacts_qs, 12)
        first_page = paginator.get_page(1)

        context["contacts"] = [
            {
                "id": contact.id,
                "username": contact.username,
                "avatar": (
                    contact.profile.avatar.url
                    if getattr(contact, "profile", None) and contact.profile.avatar
                    else None
                )
            }
            for contact in first_page.object_list
        ]

        context["contacts_has_next"] = first_page.has_next()

        context["form"] = MessageForm()

        personal_chats = get_chats_with_unread(self.request.user, is_group= False)
        group_chats = get_chats_with_unread(self.request.user, is_group= True)

        other_user_ids = set()
        for chat in personal_chats:
            for user in chat.users.all():
                if user.id != self.request.user.id: # type: ignore
                    other_user_ids.add(user.id)

        context["personal_chats"] = personal_chats
        context["group_chats"] = group_chats
        context["personal_unread_count"] = get_section_unread_count(personal_chats)
        context["group_unread_count"] = get_section_unread_count(group_chats)
        context["online_user_ids"] = get_online_user_ids(other_user_ids)

        return context
    
class ContactsPaginationView(LoginRequiredMixin, View):
    paginate_by = 12

    def get(self, request, *args, **kwargs):

        contacts = (
            get_users_by_section(request.user, "friends")
            .order_by("username")
        )

        paginator = Paginator(contacts, self.paginate_by)

        page_number = int(request.GET.get("page", 1))

        page_obj = paginator.get_page(page_number)

        if page_number > paginator.num_pages:
            return JsonResponse({
                "success": False,
                "results": [],
                "has_next": False
            })

        results = [
            {
                "id": contact.id,
                "username": contact.username,
                "avatar": (
                    contact.profile.avatar.url
                    if getattr(contact, "profile", None) and contact.profile.avatar
                    else None
                )
            }
            for contact in page_obj.object_list
        ]

        return JsonResponse({
            "success": True,
            "results": results,
            "has_next": page_obj.has_next(),
            "next_page": (
                page_obj.next_page_number()
                if page_obj.has_next()
                else None
            )
        })

class ChatWithView(LoginRequiredMixin, View):
    def post(self, request, user_id, *args, **kwargs):
        # user_id = request.POST.get("user_id")
        other_user = User.objects.get(id= user_id)
        friends = get_users_by_section(request.user, "friends")

        if other_user not in friends:
            return JsonResponse({
                "success": False,
                "error": "Користувач не є другом"
            }, status= 403)
        
        user_id_chats = Chat.objects.filter(users= request.user, is_group= False).values_list("id", flat= True)
        chat = Chat.objects.filter(
            id__in= user_id_chats,
            users= other_user,
            is_group= False
        ).first()

        if not chat:
            chat = Chat.objects.create(is_group= False)
            chat.users.add(request.user)
            chat.users.add(other_user)

        page_data = get_chat_messages_page(chat, request.user, page= 1)
        mark_chat_as_read(chat, request.user)

        return JsonResponse(
            {
                "success": True,
                "chat_id": chat.id, # type: ignore
                "username": other_user.username,
                "current_user": request.user.username,
                "is_admin": False,
                **page_data,
            }   
        )


class GroupHistoryView(LoginRequiredMixin, View):
    def get(self, request, chat_id, *args, **kwargs):
        chat = get_object_or_404(Chat, id= chat_id)

        if request.user not in chat.users.all():
            return JsonResponse({"success": False, "error": "Not a member of this chat"}, status= 403)

        page_number = int(request.GET.get("page", 1))
        page_data = get_chat_messages_page(chat, request.user, page=page_number)

        if page_number == 1:
            mark_chat_as_read(chat, request.user)

        other_user = None
        if not chat.is_group:
            other_user = chat.users.exclude(id= request.user.id).first()

        total_members = chat.users.count() if chat.is_group else 2

        group_members = []
        if chat.is_group:
            group_members = [
                {
                    "id": user.id,
                    "username": user.username,
                    "avatar": (
                        user.profile.avatar.url
                        if getattr(user, "profile", None) and user.profile.avatar
                        else None
                    ),
                    "is_admin": user.id == chat.admin_id,
                }
                for user in chat.users.select_related("profile").all()
            ]

        return JsonResponse({
            "success": True,
            "chat_id": chat.id, # type: ignore
            "is_group": chat.is_group,
            "name": chat.name if chat.is_group else (other_user.username if other_user else ""),
            "username": other_user.username if other_user else chat.name,
            "avatar": chat.avatar.url if chat.is_group and chat.avatar else None,
            "total_members": total_members,
            "members": group_members,
            "current_user": request.user.username,
            "is_admin": request.user.id == chat.admin_id,
            **page_data,
        })


class MarkChatReadView(LoginRequiredMixin, View):
    def post(self, request, chat_id, *args, **kwargs):
        try:
            chat = Chat.objects.get(id= chat_id)
        except Chat.DoesNotExist:
            return JsonResponse({"success": False, "error": "Chat not found"}, status= 404)

        if request.user not in chat.users.all():
            return JsonResponse({"success": False, "error": "Not a member of this chat"}, status= 403)

        mark_chat_as_read(chat, request.user)

        return JsonResponse({"success": True, **get_unread_status(request.user)})


class ChatMessageUploadView(LoginRequiredMixin, View):
    def post(self, request, chat_id, *args, **kwargs):
        chat = get_object_or_404(Chat, id= chat_id)
        if not chat.users.filter(id= request.user.id).exists():
            return JsonResponse({"success": False, "error": "Not a member of this chat"}, status= 403)

        text = request.POST.get("message", "").strip()
        images = request.FILES.getlist("image")

        if not text and not images:
            return JsonResponse({"success": False, "error": "Повідомлення порожнє"}, status= 400)

        message = Message.objects.create(
            text= text,
            chat= chat,
            sender= request.user,
        )

        for image in images:
            MessageImage.objects.create(message= message, image= image)

        message = (
            Message.objects
            .select_related("sender", "chat")
            .prefetch_related("images", "chat__users__profile")
            .get(id= message.id) # type: ignore
        )
        ws_data = serialize_message(message, request.user)
        ws_data["is_new"] = False

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)( # type: ignore
            f"chat_{chat_id}",
            {
                "type": "send_message",
                "message": ws_data,
            },
        )

        for user_id, payload in build_notifications_for_message(message).items():
            async_to_sync(channel_layer.group_send)( # type: ignore
                f"notifications_{user_id}",
                {
                    "type": "chat_notification",
                    "payload": payload,
                },
            )

        return JsonResponse({"success": True, "message": ws_data})


class ChatUnreadStatusView(LoginRequiredMixin, View):
    def get(self, request, *args, **kwargs):
        return JsonResponse({
            'success': True,
            **get_unread_status(request.user),
        })

class ChatActionView(LoginRequiredMixin, View):
    def post(self, request, chat_id, *args, **kwargs):
        chat = get_object_or_404(Chat, id=chat_id)

        if not chat.users.filter(id=request.user.id).exists():
            return JsonResponse({"success": False, "error": "Ви не учасник цього чату"}, status=403)

        action = request.POST.get('action', '').strip()

        if action == 'leave_group':
            if not chat.is_group:
                return JsonResponse({"success": False, "error": "Ця дія доступна лише для групових чатів"}, status=400)
            if chat.admin_id == request.user.id:
                return JsonResponse({
                    "success": False,
                    "error": "Адміністратор не може залишити групу. Видаліть чат або змініть адміністратора."},
                    status=403)
            chat.users.remove(request.user)
            return JsonResponse({"success": True})

        if action == 'delete_chat':
            if chat.is_group:
                return JsonResponse({"success": False, "error": "Цю дію можна виконати лише для особистих чатів"}, status=400)
            chat.delete()
            return JsonResponse({"success": True})

        if action == 'edit_group':
            if not chat.is_group:
                return JsonResponse({"success": False, "error": "Цю дію можна виконати лише для групових чатів"}, status=400)
            if chat.admin_id != request.user.id:
                return JsonResponse({"success": False, "error": "Тільки адміністратор може редагувати групу"}, status=403)

            name = request.POST.get('name', '').strip()
            avatar = request.FILES.get('avatar')

            if name:
                chat.name = name
            if avatar:
                chat.avatar = avatar
            chat.save()

            return JsonResponse({
                "success": True,
                "name": chat.name,
                "avatar": chat.avatar.url if chat.avatar else None,
            })

        if action == 'add_participants':
            if not chat.is_group:
                return JsonResponse({"success": False, "error": "Цю дію можна виконати лише для групових чатів"}, status=400)
            if chat.admin_id != request.user.id:
                return JsonResponse({"success": False, "error": "Тільки адміністратор може додавати учасників"}, status=403)

            user_ids = request.POST.getlist('users[]')
            if not user_ids:
                return JsonResponse({"success": False, "error": "Виберіть хоча б одного користувача"}, status=400)

            users_to_add = User.objects.filter(id__in=user_ids)
            friends = get_users_by_section(request.user, "friends").filter(id__in=user_ids).values_list("id", flat=True)

            for user in users_to_add:
                if user.id not in friends:
                    return JsonResponse({
                        "success": False,
                        "error": f"Користувач {user.username} не є другом"
                    }, status=403)

            added_users = []
            for user in users_to_add:
                if not chat.users.filter(id=user.id).exists():
                    chat.users.add(user)
                    added_users.append({
                        "id": user.id,
                        "username": user.username,
                        "avatar": (
                            user.profile.avatar.url
                            if getattr(user, "profile", None) and user.profile.avatar
                            else None
                        ),
                        "is_admin": False,
                    })

            return JsonResponse({
                "success": True,
                "added_count": len(added_users),
                "added_users": added_users,
            })

        if action == 'remove_participant':
            if not chat.is_group:
                return JsonResponse({"success": False, "error": "Цю дію можна виконати лише для групових чатів"}, status=400)
            if chat.admin_id != request.user.id:
                return JsonResponse({"success": False, "error": "Тільки адміністратор може видаляти учасників"}, status=403)

            user_id = request.POST.get('user_id')
            if not user_id:
                return JsonResponse({"success": False, "error": "Користувач для видалення не вказаний"}, status=400)

            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return JsonResponse({"success": False, "error": "Користувача не знайдено"}, status=404)

            if user.id == request.user.id:
                return JsonResponse({"success": False, "error": "Адміністратор не може видалити себе"}, status=403)

            if not chat.users.filter(id=user.id).exists():
                return JsonResponse({"success": False, "error": "Користувач не входить до групи"}, status=400)

            chat.users.remove(user)
            return JsonResponse({"success": True})

        return JsonResponse({"success": False, "error": "Невідома дія"}, status=400)


class GroupCreateFormView(LoginRequiredMixin, View):

    def get(self, request):
        contacts = (
            get_users_by_section(request.user, "friends")
            .order_by("username")
        )

        data = [
            {
                "id": contact.id, # pyright: ignore[reportAttributeAccessIssue]
                "username": contact.username,
                "avatar": (
                    contact.profile.avatar.url # pyright: ignore[reportAttributeAccessIssue]
                    if getattr(contact, "profile", None) and contact.profile.avatar # pyright: ignore[reportAttributeAccessIssue]
                    else None
                )
            }
            for contact in contacts
        ]

        return JsonResponse({
            "success": True,
            "results": data
        })

class CreateGroupview(LoginRequiredMixin, View):
    def post(self, request, *args, **kwargs):
        name = request.POST.get("name", "").strip()
        user_ids = request.POST.getlist("users[]")

        if not user_ids:
            return JsonResponse({
                "success": False,
                "error": "Виберіть хоча б одного користувача"
            }, status= 400)

        if len(user_ids) == 1:
            try:
                other_user = User.objects.get(id= user_ids[0])
                friends = get_users_by_section(request.user, "friends").filter(id= other_user.id).values_list("id", flat= True) # type: ignore
                
                if other_user.id not in friends: # type: ignore
                    return JsonResponse({
                        "success": False,
                        "error": f"Користувач {other_user.username} не є другом"
                    }, status= 403)
                
                # Find or create personal chat
                user_id_chats = Chat.objects.filter(users= request.user, is_group= False).values_list("id", flat= True)
                chat = Chat.objects.filter(
                    id__in= user_id_chats,
                    users= other_user,
                    is_group= False
                ).first()

                if not chat:
                    chat = Chat.objects.create(is_group= False)
                    chat.users.add(request.user)
                    chat.users.add(other_user)

                return JsonResponse({
                    "success": True,
                    "chat_id": chat.id, # type: ignore
                    "is_group": False,
                    "name": other_user.username,
                    "redirect": True
                })
            except User.DoesNotExist:
                return JsonResponse({
                    "success": False,
                    "error": "Користувач не знайдений"
                }, status= 404)

        if not name:
            return JsonResponse({
                "success": False,
                "error": "Назва групи не може бути порожньою"
            }, status= 400)

        if len(user_ids) < 2:
            return JsonResponse({
                "success": False,
                "error": "Потрібно вибрати щонайменше двох користувачів для групи"
            }, status= 400)

        users = User.objects.filter(id__in= user_ids)
        friends = get_users_by_section(request.user, "friends").filter(id__in= user_ids).values_list("id", flat= True)

        for user in users:
            if user.id not in friends: # type: ignore
                return JsonResponse({
                    "success": False,
                    "error": f"Користувач {user.username} не є другом"
                }, status=403)

        chat = Chat.objects.create(name= name, is_group= True, admin= request.user)
        avatar = request.FILES.get('avatar')
        if avatar:
            chat.avatar = avatar
            chat.save(update_fields= ['avatar'])

        chat.users.add(request.user)
        chat.users.add(*users)

        return JsonResponse(
            {
                "success": True,
                "chat_id": chat.id, # type: ignore
                "name": name,
                "avatar": chat.avatar.url if chat.avatar else None,
                "is_group": True,
            }
        )