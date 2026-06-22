from django.urls import path

from .views import PostAddTagView, PostCreateView, PostListView

urlpatterns = [    
    path(route= '', view= PostListView.as_view(), name= 'post'),
    path(route= 'create/', view= PostCreateView.as_view(), name= 'create_post'),
    path(route= 'add_tag/', view= PostAddTagView.as_view(), name= 'add_tag'),
]
