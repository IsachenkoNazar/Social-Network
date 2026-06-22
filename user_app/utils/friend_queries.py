from user_app.models import User


def get_users_by_section(user, section):
    # Запити
    if section == 'requests':
        return User.objects.filter(sent_friendships__to_user = user, sent_friendships__status = 'pending').exclude(username__isnull=True, username='').order_by('id')
    # Всі друзі
    if section == 'friends':
        # flat = True [1, 2, 3], без True [(1,), (2,), (3,)]
        sent_friend_ids = list(user.sent_friendships.filter(status= 'accepted').values_list('to_user_id', flat= True)) # type: ignore
        received_friend_ids = list(user.received_friendships.filter(status= 'accepted').values_list('from_user_id', flat= True)) # type: ignore
        
        return User.objects.filter(id__in= sent_friend_ids + received_friend_ids).exclude(username__isnull=True, username='').order_by('id')
    
    if section == 'recommendations':
        sent_busy_ids = list(user.sent_friendships.values_list("to_user_id", flat= True)) # type: ignore
        received_busy_ids = list(user.received_friendships.values_list('from_user_id', flat = True)) # type: ignore
        busy_ids = sent_busy_ids + received_busy_ids + [user.id] # type: ignore
        
        return User.objects.exclude(id__in = busy_ids).exclude(username__isnull=True, username='').order_by('id')
    
    else:
        raise ValueError("Невірний розділ")