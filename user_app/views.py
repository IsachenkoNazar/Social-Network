from time import time
from typing import Any
from django.contrib.auth import authenticate, login, logout
from django.urls import reverse, reverse_lazy
from django.views.generic.base import TemplateView
from django.views import View
from django.http import HttpRequest, JsonResponse
from django.shortcuts import redirect, get_object_or_404
from django.template.loader import render_to_string
from django.core.paginator import Paginator
from django.contrib.auth.mixins import LoginRequiredMixin


from post_app.models import Post
from .models import Friendship, User

from .services import confirm_user
from .forms import UserExpandInfoForm, UserRegisterForm, UserLoginForm, UserConfirmForm

from .utils.friend_queries import get_users_by_section
from .utils.friend_action import add_friend_request, dismiss_recommendation, accept_friend_request, delete_friendship
from .utils.online_status import get_online_user_ids
from .utils.utils import generate_confirm_code, send_confirm_code, create_random_users_with_friendships, del_user
from user_app.utils.online_status import invalidate_friends_cache, get_cached_friend_ids
from home_app.utils.side_panel import get_profile_stats, get_user_avatar

# Create your views here.


class AuthView(TemplateView):
    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return redirect('home')
        return super().dispatch(request, *args, **kwargs)

    template_name = 'user_app/auth.html'
    def get_context_data(self, **kwargs) -> dict[str, Any]:
        context = super().get_context_data(**kwargs)
        if not self.request.user.is_authenticated:
            context["form_register"] = UserRegisterForm()
            context['form_login'] = UserLoginForm()
            context['form_confirm_email'] = UserConfirmForm()  
            # context['form_info'] = UserExpandInfoForm()
        return context


class RegisterView(View):
    def post(self, request: HttpRequest, *args, **kwargs):
        form = UserRegisterForm(request.POST)

        if not form.is_valid():
            return JsonResponse({
                "success": False,
                "errors": form.errors.get_json_data()
            }, status=400)

        confirm_code = generate_confirm_code()

        request.session["pending_user"] = {
            "email": form.cleaned_data["email"],
            "password1": form.cleaned_data["password1"],
            "password2": form.cleaned_data["password2"],
        }
        
        request.session["confirm_code"] = confirm_code

        # request.session["confirm_code_created_at"] = time()

        send_confirm_code(code= confirm_code, email= form.cleaned_data["email"])


        return JsonResponse({
            "success": True,
            "message": "Код Відправлено"
        })

class ConfirmView(View):
    def post(self, request: HttpRequest, *args, **kwargs):
        form = UserConfirmForm(
            request.POST,
            confirm_code= request.session.get("confirm_code")
        )

        if not form.is_valid():
            return JsonResponse({
                "success": False,
                "errors": form.errors.get_json_data()
            }, status=400)

        try:
            user = confirm_user(
                session=request.session,
                input_code=form.cleaned_data["code"]
            )
            

        except ValueError as error:
            return JsonResponse({
                "success": False,
                "errors": {
                    "__all__": [{"message": str(error), "code": "invalid"}],
                },
            }, status=400)

        return JsonResponse({
            "success": True,
            "message": "Акаунт підтверджено"
        })

class LoginView(View):
    def post(self, request: HttpRequest, *args, **kwargs):
        form = UserLoginForm(request, data=request.POST)

        if form.is_valid():
            user = form.get_user()
            login(request, user)

            return JsonResponse({
                'success': True,
                'is_profile_complete': bool(user.username),
            })
        
        else:
            return JsonResponse({
                'success': False,
                'errors': form.errors.get_json_data(),
            })


class ExpandInfoView(View):
    def post(self, request: HttpRequest, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({
                "success": False,
                "message": "Не авторизований"
            }, status=401)

        form = UserExpandInfoForm(
            request.POST,
            instance=request.user # type: ignore
        )

        if form.is_valid():
            user = form.save(commit=False)
            user.save()

            return JsonResponse({
                "success": True,
                "message": "Дані оновлено"
            })

        return JsonResponse({
            "success": False,
            "errors": form.errors.get_json_data()
        }, status=400)
    
class LogoutView(View):
    def get(self, request: HttpRequest, *args, **kwargs):
        if request.user.is_authenticated:
            logout(request)
            return redirect('auth')
        else:
            return redirect(request.META.get('HTTP_REFERER', 'home'))

class FriendsView(LoginRequiredMixin, TemplateView):
    model = Friendship
    template_name = 'user_app/friends.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["sections"] = {
            "requests": {
                "title": "Запити",
                "users": get_users_by_section(self.request.user, "requests")[:3],
            },
            "recommendations": {
                "title": "Рекомендації",
                "users": get_users_by_section(self.request.user, "recommendations")[:6],
            },
            "friends": {
                "title": "Всі друзі",
                "users": get_users_by_section(self.request.user, "friends")[:6],
            },
        }
        
    
        return context

class FriendsSectionView(FriendsView):
    SECTION_TITLES = {
        "requests": "Запити",
        "recommendations": "Рекомендації",
        "friends": "Всі друзі",
    }

    def get(self, request, section, *args, **kwargs):

        users = get_users_by_section(request.user, section)

        page_obj = Paginator(users, 6).get_page(
            request.GET.get("page", 1)
        )

        html = render_to_string(
            "user_app/particles/friend/friend_cards.html",
            {
                "users": page_obj.object_list,
                "section": section,
            },
            request=request
        )

        return JsonResponse({
            "html": html,
            "title": self.SECTION_TITLES.get(section, "Друзі"),
            "has_next": page_obj.has_next(),
        })

class FriendActionView(LoginRequiredMixin, View):
    login_url = reverse_lazy('auth')

    def post(self, request, user_id, action, *args, **kwargs):

        other_user = get_object_or_404(User, id=user_id)

        if action == 'add':
            add_friend_request(request.user, other_user)

        if action == 'dismiss':
            dismiss_recommendation(request.user, other_user)

        if action == 'accept':
            try:
                accept_friend_request(request.user, other_user)
            except ValueError as error:
                return JsonResponse({
                    "success": False,
                    "errors": {
                        "__all__": [{"message": str(error), "code": "invalid"}],
                    },
                }, status=400)

        if action == 'delete':
            delete_friendship(request.user, other_user)

        return JsonResponse({
            "success": True,
            "action": action,
        })

class FriendProfileView(LoginRequiredMixin, View):
    POSTS_PER_PAGE = 5

    def get_posts_queryset(self, user):
        return (
            Post.objects
            .filter(author=user)
            .select_related("author")
            .prefetch_related("images", "tags", "links")
            .order_by("-created_at")
        )

    def get(self, request, user_id, *args, **kwargs):
        user = get_object_or_404(User, id=user_id)
        section = request.GET.get("section")
        page_number = request.GET.get("page", 1)

        paginator = Paginator(self.get_posts_queryset(user), self.POSTS_PER_PAGE)
        page_obj = paginator.get_page(page_number)

        if request.headers.get("X-Requested-With") == "XMLHttpRequest" and request.GET.get("page"):
            if paginator.num_pages and int(page_number) > paginator.num_pages:
                return JsonResponse({"success": False})

            return JsonResponse({
                "success": True,
                "html": render_to_string(
                    "post_app/particles/show_post.html",
                    {"posts": page_obj.object_list},
                    request=request,
                ),
                "has_next": page_obj.has_next(),
            })

        posts_html = render_to_string(
            "post_app/particles/show_post.html",
            {"posts": page_obj.object_list},
            request=request,
        )
        if not page_obj.object_list:
            posts_html = '<p class="empty-note">Дописів поки немає</p>'

        profile_html = render_to_string(
            "user_app/particles/friend/profile_content.html",
            {
                "user": user,
                "section": section,
                "profile_stats": get_profile_stats(user),
                "user_avatar": get_user_avatar(user),
            },
            request=request,
        )

        return JsonResponse({
            "html": profile_html,
            "posts_html": posts_html,
            "has_next": page_obj.has_next(),
            "user_id": user.id, # type: ignore
            "username": user.username,
        })


class OnlineStatusView(LoginRequiredMixin, View):
    def get(self, request, *args, **kwargs):
        def _fetch_from_db(user):
            friends_queryset = get_users_by_section(user, 'friends')
            return list(friends_queryset.values_list('id', flat=True))

        friend_ids = get_cached_friend_ids(request.user, _fetch_from_db)

        online_user_ids = get_online_user_ids(friend_ids)

        return JsonResponse({
            'success': True,
            'online_user_ids': list(online_user_ids),
        })