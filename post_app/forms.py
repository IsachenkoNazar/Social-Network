from typing import Any
from io import BytesIO
from PIL import Image
from django import forms
from django.core.files.base import ContentFile

from post_app.models import Post, Tag, PostLink, PostImage, PostView


MAX_COMPRESSED_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB

# додати поле для завантаження зображення та його валідацію
class MultipleFieldInput(forms.ClearableFileInput):
    """
    Custom widget to allow multiple file(photo) uploads.
    """
    allow_multiple_selected = True

class multipleFileField(forms.FileField):
    """
    Custom field to handle multiple file(photo) uploads and validate their size.
    """
    widget = MultipleFieldInput

    def clean(self, data, initial= None):
        single_file_clean = super().clean

        if isinstance(data, (list, tuple)):
            return [single_file_clean(file, initial= initial) for file in data]

        return single_file_clean(data, initial)

class PostCreationForm(forms.ModelForm):
    tags = forms.ModelMultipleChoiceField(
        required= False,
        label= '',
        queryset= Tag.objects.all(),
        widget= forms.CheckboxSelectMultiple,
    )

    image = multipleFileField(
        required= False,
        label= '',
        widget= MultipleFieldInput(attrs={
            'id': 'file-input',
            'class': 'file-input',
            'accept': 'image/*',
        })
    )

    class Meta:
        model = Post
        fields = ('title', 'topic', 'content')
        widgets = {
            "title": forms.TextInput(attrs={
                'placeholder': 'Напишіть назву публікації'
            }),
            "topic": forms.TextInput(attrs={
                'placeholder': 'Напишіть тему публікаціїї'
            }),
            'content': forms.Textarea(attrs={
                'placeholder': 'Текст публікації',
                'rows': 5
            }),
        }

        labels = {
            'title': 'Назва публікації',
            'topic': 'Тема публікації',
            'content': '',
        }

    field_order = ['title', 'topic', 'tags', 'content', 'image']

    def __init__(self, *args, links= None, images= None, **kwargs):
        '''
            ініціалізує форму
            
            Параметри Links і images отримуємо не із форми ModelForm, a з view
        '''
        super().__init__(*args, **kwargs)
        
        self.fields["tags"].label_from_instance = lambda obj: f"#{obj.name}" # pyright: ignore[reportAttributeAccessIssue]
        
        self.links_list = []
        
        self.images_list = []
        
        if links is None:
            links = []
            
        for link in links:
            clean_link = link.strip()
            
            if clean_link:
                self.links_list.append(clean_link)
                
        if images is not None:
            self.images_list = list(images)
            
    def clean(self):
        cleaned_data = super().clean()
        
        url_field =  forms.URLField()
        image_field = forms.ImageField()
        for link in self.links_list:
            try:
                url_field.clean(link)
            except forms.ValidationError:
                self.add_error(None, f"Некоректне посилання: {link}") # 'links'
        
        for image in self.images_list:
            try:
                image_field.clean(image)
            except forms.ValidationError:
                self.add_error(None, f"Завантажте коректне зображення") # 'images'
        
        return cleaned_data
    
    def save(self, author, commit= True):  # type: ignore
        post: Post = super().save(commit= False)
        post.author = author
        
        post.save()

        if commit:
            tags = self.cleaned_data.get("tags")
            if tags:
                post.tags.set(tags)
            
            
            for url in self.links_list:
                PostLink.objects.create(post= post, url= url)
            for image in self.images_list:
                PostImage.objects.create(
                    post= post,
                    original_image= image,
                    compressed_image= self._compressed_image(image)
                )

        return post
 
    def _compressed_image(self, image):
        '''
            повна робота з модулем Pillow
        '''
        
        image.seek(0)
        compressed_image = Image.open(image)
        compressed_image = compressed_image.convert("RGB")
        
        quality = 85
        width, height = compressed_image.size
        
        while True:
            buffer = BytesIO()
            compressed_image.save(fp= buffer, format= 'JPEG', quality= quality, optimize= True)
            
            if buffer.tell() <= MAX_COMPRESSED_IMAGE_SIZE:
                break
            
            if quality > 35:
                quality -= 10
            else:
                if width <= 1 or height <= 1:
                    break
                
                width = int(width * 0.9)
                height = int(height * 0.9)
                compressed_image = compressed_image.resize((width, height), Image.Resampling.LANCZOS)
                
        image.seek(0)
        
        compressed_name = f'compressed_{image.name.rsplit('.', 1)[0]}.jpg'
        
        return ContentFile(buffer.getvalue(), name= compressed_name)
    
class PostAddTagForm(forms.ModelForm):
    class Meta:
        model = Tag
        fields = ('name', )
        widgets = {
            "name": forms.TextInput(attrs={
                'placeholder': '#|'
            }),
        }

        labels = {
            'name': 'Назва',
        }