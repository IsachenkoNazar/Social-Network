from django.core.cache import cache

ONLINE_TIMEOUT = 60
ONLINE_CACHE_PREFIX = 'user_online:'
CONNECTION_COUNT_SUFFIX = ':connections'

FRIENDS_CACHE_PREFIX = 'user_friends:'
FRIENDS_CACHE_TIMEOUT = 3600


def _get_cache_key(user_id):
    return f'{ONLINE_CACHE_PREFIX}{user_id}'


def _get_connection_count_key(user_id):
    return f'{_get_cache_key(user_id)}{CONNECTION_COUNT_SUFFIX}'


def mark_user_online(user_id):
    cache.set(_get_cache_key(user_id), True, ONLINE_TIMEOUT)


def mark_user_offline(user_id):
    cache.delete(_get_cache_key(user_id))
    cache.delete(_get_connection_count_key(user_id))


def register_presence_connection(user_id):
    count_key = _get_connection_count_key(user_id)
    count = cache.get(count_key, 0) + 1
    cache.set(count_key, count, ONLINE_TIMEOUT)
    mark_user_online(user_id)
    return count


def unregister_presence_connection(user_id):
    count_key = _get_connection_count_key(user_id)
    count = cache.get(count_key, 0)

    if count <= 1:
        mark_user_offline(user_id)
        return True

    cache.set(count_key, count - 1, ONLINE_TIMEOUT)
    mark_user_online(user_id)
    return False


def refresh_presence(user_id):
    count_key = _get_connection_count_key(user_id)
    count = cache.get(count_key, 0)

    if count > 0:
        cache.set(count_key, count, ONLINE_TIMEOUT)
        mark_user_online(user_id)


def is_user_online(user_id):
    return bool(cache.get(_get_cache_key(user_id)))


def get_online_user_ids(user_ids):
    if not user_ids:
        return []

    keys = {user_id: _get_cache_key(user_id) for user_id in user_ids}
    cached = cache.get_many(keys.values())

    return [
        user_id
        for user_id, key in keys.items()
        if cached.get(key)
    ]


def _get_friends_cache_key(user_id):
    return f'{FRIENDS_CACHE_PREFIX}{user_id}'

def get_cached_friend_ids(user, fetch_from_db_func):
    cache_key = _get_friends_cache_key(user.id)
    friend_ids = cache.get(cache_key)
    
    if friend_ids is None:
        friend_ids = fetch_from_db_func(user)
        cache.set(cache_key, friend_ids, FRIENDS_CACHE_TIMEOUT)
        
    return friend_ids

def invalidate_friends_cache(user_id):
    cache.delete(_get_friends_cache_key(user_id))
