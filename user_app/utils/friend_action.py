from user_app.models import Friendship

# створюємо запит в друзі
def add_friend_request(user, other_user):
    
    Friendship.objects.get_or_create(from_user= user, to_user = other_user, defaults={'status': 'pending'})
    return {'label': 'Очікування'}

# видаляємо користувача із рекомендації
def dismiss_recommendation(user, other_user):
    
    Friendship.objects.get_or_create(from_user= user, to_user = other_user, defaults={'status': 'dismissed'})
    return {'remove': True}
# додаємо у друзі
def accept_friend_request(user, other_user):
    friendship = Friendship.objects.filter(
        from_user=other_user,
        to_user=user,
        status='pending',
    ).first()

    if not friendship:
        raise ValueError('Запит у друзі не знайдено')

    friendship.status = 'accepted'
    friendship.save()

    return {'remove': True, 'friend': other_user}
# видаляємо запит або дружбу
def delete_friendship(user, other_user):
    friendship = Friendship.objects.filter(from_user = user, to_user = other_user).first()
    if not friendship:
        friendship = Friendship.objects.filter(from_user = other_user, to_user = user).first()
    if friendship:
        friendship.delete()
    return {'remove': True}