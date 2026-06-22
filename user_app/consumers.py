import asyncio
import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from user_app.utils.friend_queries import get_users_by_section
from user_app.utils.online_status import (
    get_online_user_ids,
    refresh_presence,
    register_presence_connection,
    unregister_presence_connection,
    is_user_online,
    get_cached_friend_ids,
)


class PresenceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope.get('user')
        if user is None or user.is_anonymous:
            await self.close()
            return

        self.user_id = user.id
        self.room_group_name = f'presence_{self.user_id}'
        self.friend_ids = await self.get_friend_ids()

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        online_user_ids = await database_sync_to_async(get_online_user_ids)(self.friend_ids)

        await self.send(text_data=json.dumps({
            'type': 'initial_status',
            'online_user_ids': list(online_user_ids),
        }))

        await database_sync_to_async(register_presence_connection)(self.user_id)
        await self.notify_friends(is_online=True)

    async def disconnect(self, close_code):
        fully_offline = False
        

        if hasattr(self, 'user_id'):
            fully_offline = await database_sync_to_async(
                unregister_presence_connection
            )(self.user_id)

        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

        if fully_offline:
            asyncio.create_task(self.delayed_offline_notification())

    async def receive(self, text_data):
        data = json.loads(text_data)

        if data.get('type') == 'ping' and hasattr(self, 'user_id'):
            await database_sync_to_async(refresh_presence)(self.user_id)

    async def delayed_offline_notification(self):
        await asyncio.sleep(5) 
        
        still_online = await database_sync_to_async(is_user_online)(self.user_id)
        
        if not still_online and hasattr(self, 'friend_ids'):
            await self.notify_friends(is_online=False)

    async def notify_friends(self, is_online):
        if not self.friend_ids:
            return
        
        tasks = [
            self.channel_layer.group_send(
                f'presence_{friend_id}',
                {
                    'type': 'presence_update',
                    'user_id': self.user_id,
                    'is_online': is_online,
                },
            )
            for friend_id in self.friend_ids
        ]
        await asyncio.gather(*tasks, return_exceptions=True)

    async def presence_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user_status',
            'user_id': event['user_id'],
            'is_online': event['is_online'],
        }))

    @database_sync_to_async
    def get_friend_ids(self):
        user = self.scope.get('user')

        def _fetch_from_db(u):
            friends_queryset = get_users_by_section(u, 'friends')
            return list(friends_queryset.values_list('id', flat=True))

        return get_cached_friend_ids(user, _fetch_from_db)