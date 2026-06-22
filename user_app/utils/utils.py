import random
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model

from user_app.models import Friendship

def generate_confirm_code() -> str:
    return ''.join(str(random.randint(0, 9)) for _ in range(6))

def send_confirm_code(email: str, code: str) -> None:
    send_mail(
        subject="Код підтвердження",
        message=f"Ваш код підтвердження: {code}",
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[email],
        fail_silently=False,
    )


User = get_user_model()

def del_user():
    User.objects.filter(email__startswith="user").delete()


def create_random_users_with_friendships(
    target_user_id=27,
    users_count=10,
    without_friendship_ratio=0.2,
):

    target_user = User.objects.filter(id=target_user_id).first()

    if not target_user:
        print(f"Користувач з id {target_user_id} не знайдений.")
        return []

    statuses = ["pending", "accepted"]

    created_users = []

    for i in range(users_count):

        random_suffix = random.randint(1000, 9999)

        user = User.objects.create_user(
            email=f"user{i}_{random_suffix}@test.com",
            password="test12345",
            username=f"user_{i}_{random_suffix}",
            first_name = f"name_{i}",
            last_name = f"lastname_{random_suffix}",
        )

        created_users.append(user)

        if random.random() < without_friendship_ratio:
            continue

        if random.choice([True, False]):
            from_user = user
            to_user = target_user
        else:
            from_user = target_user
            to_user = user

        Friendship.objects.create(
            from_user=from_user,
            to_user=to_user,
            status=random.choice(statuses),
        )

    return created_users