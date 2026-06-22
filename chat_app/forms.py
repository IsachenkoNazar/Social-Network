from django import forms

class MessageForm(forms.Form):
    message = forms.CharField(
        max_length= 100,
        required= False,
        label= "", 
        widget= forms.TextInput(attrs= {
            'placeholder': 'Повідомлення',
            'id': 'message-id'
        })
    )
