from django.http import JsonResponse
from django.urls import reverse_lazy
from django.views.generic.base import TemplateView
from django.template.loader import render_to_string
from django.core.paginator import Paginator
from django.contrib.auth.mixins import LoginRequiredMixin

from user_app.forms import UserExpandInfoForm
from post_app.forms import PostCreationForm
from post_app.models import Post
from home_app.utils.side_panel import get_side_panel_context

# Create your views here.


class HomeView(LoginRequiredMixin, TemplateView):
    template_name = 'home_app/home.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        user = self.request.user

        if user.is_authenticated and not user.username: # type: ignore
            context['form_info'] = UserExpandInfoForm(
                instance= user # type: ignore
            )
        
        context["form_create"] = PostCreationForm()
        context["user"] = self.request.user

        queryset = Post.objects.select_related("author").prefetch_related(
            "images",
            "tags",
            "links"
        ).order_by("-created_at")

        if user.is_authenticated:
            queryset = queryset.exclude(author=user)

        context["posts"] = queryset[:10]
        context.update(get_side_panel_context(user))

        return context

    def get(self, request, *args, **kwargs):
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            user = request.user
            queryset = Post.objects.select_related("author").prefetch_related(
                "images",
                "tags",
                "links"
            ).order_by("-created_at")

            if user.is_authenticated:
                queryset = queryset.exclude(author=user)

            paginator = Paginator(queryset, 10)
            page_number = request.GET.get('page', 1)
            page_obj = paginator.get_page(page_number)

            try:
                if int(page_number) > paginator.num_pages:
                    return JsonResponse({'success': False})
            
            except (TypeError, ValueError):
                return JsonResponse({'success': False, })

            return JsonResponse({
                'success': True,
                'html': render_to_string('post_app/particles/show_post.html', {'posts': page_obj.object_list})
            })

        return super().get(request, *args, **kwargs)
