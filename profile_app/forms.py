from django import forms
from django.contrib.auth import get_user_model
from .models import Profile

User = get_user_model()

class ProfileForm(forms.ModelForm):
    class Meta:
        model = Profile
        fields = ['avatar', 'pseudonym']
        widgets = {
            'avatar': forms.ClearableFileInput(attrs={
                'class': 'form-control-file',
                'placeholder': 'Виберіть аватар'
            }),
            'pseudonym': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Введіть псевдонім'
            }),
        }
        labels = {
            'avatar': 'Аватар',
            'pseudonym': 'Псевдонім',
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and hasattr(self.instance, 'user'):
            self.full_name = f"{self.instance.user.first_name} {self.instance.user.last_name}".strip()
        else:
            self.full_name = ''

    def save(self, commit=True):
        profile = super().save(commit=False)

        if not self.cleaned_data.get('avatar'):
            profile.avatar = self.instance.avatar

        if commit:
            profile.save()
        return profile

class InfoForm(forms.ModelForm):
    birth_date = forms.DateTimeField(
        required=False,
        widget=forms.DateInput(attrs={'type': 'date'}),
        label='Дата рождения'
    )

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and hasattr(self.instance, 'profile'):
            self.initial['birth_date'] = self.instance.profile.birth_date

    def save(self, commit=True):
        user = super().save(commit=commit)
        birth_date = self.cleaned_data.get('birth_date')
        
        if hasattr(user, 'profile'):
            user.profile.birth_date = birth_date
            if commit:
                user.profile.save()
        
        return user


class PasswordForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['password']
        widgets = {
            'password': forms.PasswordInput(attrs={
                'class': 'password-form',
                'placeholder': 'введіть пароль',
                'id': 'form-password',
            })
        }


class SignatureForm(forms.ModelForm):
    class Meta:
        model = Profile
        fields = ['pseudonym', 'signature', 'is_image_signature', 'is_text_signature']
        widgets = {
            'pseudonym': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Введіть псевдонім'
            }),
            'signature': forms.FileInput(attrs={
                'accept': 'image/*'
            }),
            'is_image_signature': forms.CheckboxInput(),
            'is_text_signature': forms.CheckboxInput(),
        }
        labels = {
            'pseudonym': 'Псевдонім автора',
            'signature': 'Мій електронний підпис',
            'is_image_signature': 'Показувати підпис як зображення',
            'is_text_signature': 'Показувати псевдонім як підпис',
        }
        