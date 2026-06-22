from django.http import JsonResponse
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from django.views.generic import FormView, ListView, TemplateView
from django.template.loader import render_to_string
from django.core.paginator import Paginator

from post_app.forms import PostAddTagForm, PostCreationForm
from home_app.utils.side_panel import get_side_panel_context
from .models import Post
# Create your views here.

class PostListView(LoginRequiredMixin, ListView):
    model = Post
    template_name = 'post_app/post.html'
    context_object_name = 'posts'
    paginate_by = 5
    
    def get_context_data(self, **kwargs) -> dict:
        context = super().get_context_data(**kwargs)
        context["form_create"] = PostCreationForm()
        context["form_add_tag"] = PostAddTagForm()
        context['user'] = self.request.user
        context.update(get_side_panel_context(self.request.user))
        return context
    
    def get_queryset(self):
        return (
            Post.objects
            .filter(author=self.request.user)
            .select_related("author")
            .prefetch_related(
                "images",
                "tags",
                "links"
            )
            .order_by("-created_at")
        )
    
    def get(self, request, *args, **kwargs):
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            queryset = self.get_queryset()
            paginator = Paginator(queryset, self.paginate_by)
            page_number = request.GET.get('page')
            page_obj = paginator.get_page(page_number)
            if int(page_number) > paginator.num_pages: # type: ignore
                return JsonResponse({'success': False})
            return JsonResponse({
                'success': True,
                'html': render_to_string('post_app/particles/show_post.html', {'posts': page_obj.object_list})
            })

        return super().get(request, *args, **kwargs)

class PostCreateView(LoginRequiredMixin, FormView):
    """
    View для створення публікації.
    
    Сторінка доступна тільки авторизованому користувачу.
    Форма відправляється через fetch, тому view повертає JSON,
    а не звичайний HTML redirect.
    """
    
    template_name = 'post_app/particles/create_post.html'
    form_class = PostCreationForm
    success_url = reverse_lazy("post")

    def get_form_kwargs(self):
        """
        Передає у форму додатковий параметр links.
        
        У шаблоні може бути кілька полів input name="links".
        request.POST.getlist("links") збирає їх усі в один список.
        """
        kwargs = super().get_form_kwargs()
        
        if self.request.method == "POST":
            kwargs["links"] = self.request.POST.getlist("links")
            kwargs["images"] = self.request.FILES.getlist("image")
            
        return kwargs

    def form_valid(self, form):
        """
        Обробляє валідну форму.
        
        Зберігає пост з поточним користувачем як автором
        та повертає JSON-відповідь для JavaScript.
        """
        
        post = form.save(author=self.request.user)

        return JsonResponse(
            {
                "success": True,
                "message": "Публікацію створено успішно",
                "redirect_url": str(self.success_url),
                "post_id": post.id,
            }
        )

    def form_invalid(self, form):
        """
        Обробляє невалідну форму.
        
        Повертає помилки у JSON-форматі, щоб JavaScript
        міг показати їх без перезавантаження сторінки.
        """
        return JsonResponse(
            {
                "success": False,
                "errors": form.errors.get_json_data(),
            },
            status=400,
        )

class PostAddTagView(LoginRequiredMixin, FormView):
    template_name = 'post_app/particles/add_tag.html'
    form_class = PostAddTagForm

    def form_valid(self, form):
        tag = form.save()

        checkbox_html = f"""
        <label for="id_tags_{tag.id}">
            <input
                type="checkbox"
                name="tags"
                value="{tag.id}"
                id="id_tags_{tag.id}"
                checked
            >
            #{tag.name}
        </label>
        """

        return JsonResponse({
            'success': True,
            'tag': {
                'id': tag.id,
                'html': checkbox_html,
            }
        })

    def form_invalid(self, form):
        return JsonResponse({
            'success': False,
            'errors': form.errors,
        }, status=400)