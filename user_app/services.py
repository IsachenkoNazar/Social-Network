from .forms import UserRegisterForm


def confirm_user(session, input_code):
    session_code = session.pop("confirm_code")
    pending_user = session.pop("pending_user")

    if not session_code or not pending_user:
        raise ValueError("Сесія не має необхідних даних для підтвердження")

    if input_code != session_code:
        raise ValueError("Код підтвердження невірний")

    form = UserRegisterForm(data=pending_user)

    if not form.is_valid():
        raise ValueError("Дані користувача невалідні")

    user = form.save()

    # session.pop("confirm_code_created_at", None)

    return user