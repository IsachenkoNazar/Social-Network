from typing import Any

from django import forms
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.forms import AuthenticationForm

User = get_user_model()

class UserRegisterForm(forms.ModelForm):
    password1 = forms.CharField(
        max_length= 100,
        label= 'Пароль', 
        required= True,
        widget= forms.PasswordInput(
            attrs={
                'placeholder': 'Введи пароль',
                'class': "password-input",
            }
        )
    )

    password2 = forms.CharField(
        max_length= 100,
        label= 'Підтверди пароль', 
        required= True,
        help_text= "",
        widget= forms.PasswordInput(
            attrs={
                'placeholder': 'Повтори пароль',
                'class': "password-input",
                'autocomplete': 'new-password',
            }
        )
    )

    class Meta:
        model = User
        fields = ('email',)
        labels = {
            'email': 'Електронна пошта'
        }
        widgets = {
            'email': forms.EmailInput(attrs={
                'placeholder': 'you@example.com',
                'class': "email-input",
            })
        }

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError('Користувач з такою електронною поштою вже існує')
        return email
    
    def clean(self) -> dict[str, Any]:
        password1 = self.cleaned_data.get('password1')
        password2 = self.cleaned_data.get('password2')
        if password1 and password2 and password1 != password2:
            self.add_error('password2', 'Паролі не співпадають')
        cleaned_data = super().clean()
        return cleaned_data
    
    def save(self, commit: bool = True) -> Any:
        user = super().save(commit= False)
        # user.username = ''
        user.set_password(self.cleaned_data['password1'])
        if commit:
            user.save()
        return user

class UserLoginForm(AuthenticationForm):
    username = forms.EmailField(
        max_length= 200,
        label= 'Електронна пошта',
        required= True,
        widget= forms.EmailInput(
            attrs={
                'placeholder': "you@example.com",
                'autocomplete': 'email',
                'autofocus': True,
                'class': "email-input",
                
            }
        )
    )

    password = forms.CharField(
        max_length= 100,
        label= 'Пароль',
        required= True,
        widget= forms.PasswordInput(
            attrs={
                'placeholder': 'Введи пароль',
                'autocomplete': 'current-password',
                'class': "password-input",
            }
        )
    )

    error_messages = {
        'invalid_login': 'Невірний email або пароль',
        'inactive': 'Цей аккаунт не активний',
    }

    def clean(self) -> dict[str, Any]:
        email = self.cleaned_data.get('username')
        password = self.cleaned_data.get('password')

        if email and password:
            self.user_cache = authenticate(self.request, username=email, password=password)
            if self.user_cache is None:
                raise forms.ValidationError(
                    self.error_messages['invalid_login'],
                    code='invalid_login',
                    params={
                        'username': self.username_field.verbose_name,
                    },
                )
            else:
                self.confirm_login_allowed(self.user_cache)

        return self.cleaned_data


class UserConfirmForm(forms.Form):
    def __init__(self, *args, confirm_code=None, **kwargs):
        super().__init__(*args, **kwargs)

        self.confirm_code = confirm_code

        for index in range(1, 7):
            self.fields[f'code{index}'] = forms.CharField(
                max_length= 1,
                min_length= 1,
                required= True,
                label= '',
                widget=forms.TextInput(
                    attrs={
                        "class": "code-input",
                        "placeholder": "___",
                        "maxlength": 1,
                        "inputmode": "numeric"
                    }
                )
            )

    def clean(self) -> dict[str, Any]:
        cleaned_data = super().clean()

        code_digits = []

        for index in range(1, 7):
            digit = cleaned_data.get(f'code{index}')

            if not digit:
                self.add_error(f'code{index}', 'Введіть цифру')
            else:
                code_digits.append(digit)

        full_code = ''.join(code_digits)

        if self.confirm_code and full_code != self.confirm_code:
            raise forms.ValidationError('Невірний код підтвердження')

        cleaned_data['code'] = full_code

        return cleaned_data


class UserExpandInfoForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ('username', 'first_name')
        labels = {
            'username': 'Псевдонім автора',
            'first_name': 'Ім’я користувача'
        }
        widgets = {
            'username': forms.TextInput(attrs={
                'placeholder': 'Введіть Псевдонім автора',
                'autofocus': True,
            }),
            'first_name': forms.TextInput(attrs={
                'placeholder': '@',
                'autofocus': True,
            }),
        }

    def clean(self):
        cleaned_data = super().clean()

        username = cleaned_data.get('username')
        first_name = cleaned_data.get('first_name')

        if not username or not first_name:
            raise forms.ValidationError('Усі поля обов’язкові')

        return cleaned_data

    def clean_username(self):
        username = self.cleaned_data.get('username')

        queryset = User.objects.filter(username=username)
        if self.instance.pk:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise forms.ValidationError('Цей псевдонім вже зайнятий')

        return username
