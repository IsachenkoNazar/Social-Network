import json
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from chat_app.models import Chat, Message
from chat_app.utils.chat_queries import build_notifications_for_message

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.chat_id = self.scope['url_route']['kwargs']['chat_id']  # type: ignore
        self.room_group_name = f'chat_{self.chat_id}'
        chat_title = await self.get_chat_title()

        if chat_title is None:
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        
        await self.mark_chat_as_read_db()

        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'username': chat_title,
        }))

    async def disconnect(self, close_code): # type: ignore
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):  # type: ignore
        data = json.loads(text_data)

        if data.get('type') == 'ping':
            await self.send(text_data=json.dumps({'type': 'pong'}))
            return

        text = data.get('message', '')

        if not text.strip():
            return

        message = await self.save_message(text)
        ws_data = await self.get_message_ws_data(message)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'send_message',
                'message': ws_data,
            },
        )

        await self.broadcast_notifications(message)

    async def send_message(self, event):
        message_payload = event['message']
        await self.send(text_data=json.dumps(message_payload))

    async def broadcast_notifications(self, message):
        payloads = await self.get_notification_payloads(message)

        for user_id, payload in payloads.items():
            await self.channel_layer.group_send(
                f'notifications_{user_id}',
                {
                    'type': 'chat_notification',
                    'payload': payload,
                },
            )

    @database_sync_to_async
    def save_message(self, text):
        user = self.scope.get('user')
        return Message.objects.create(
            text=text,
            chat_id=self.chat_id,
            sender=user,
        )

    @database_sync_to_async
    def mark_chat_as_read_db(self):
        user = self.scope.get('user')
        if user and not user.is_anonymous:
            pass

    @database_sync_to_async
    def get_message_ws_data(self, message):
        message = Message.objects.select_related('sender').get(id=message.id)
        return {
            'sender': message.sender.username,
            'text': message.text,
            'images': [image.image.url for image in message.images.all()], # type: ignore
            'datetime': message.created_at.isoformat(),
            'is_new': False,
        }

    @database_sync_to_async
    def get_notification_payloads(self, message):
        message = Message.objects.select_related('sender', 'chat').prefetch_related(
            'chat__users__profile'
        ).get(id=message.id)
        return build_notifications_for_message(message)

    @database_sync_to_async
    def get_chat_title(self):
        user = self.scope.get('user')
        if user is None or user.is_anonymous:
            return None

        chat = Chat.objects.prefetch_related('users').get(id=self.chat_id)

        if not chat.users.filter(id=user.id).exists():
            return None

        if chat.is_group:
            return chat.name or 'Груповий чат'

        other_user = chat.users.exclude(id=user.id).first()
        return other_user.username if other_user else None

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope.get('user')
        if user is None or user.is_anonymous:
            await self.close()
            return

        self.user_id = user.id
        self.group_name = f'notifications_{self.user_id}'

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code): # type: ignore
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data): # type: ignore
        try:
            data = json.loads(text_data)
            if data.get('type') == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
                return
        except (json.JSONDecodeError, TypeError):
            pass

    async def chat_notification(self, event):
        await self.send(text_data=json.dumps(event['payload']))
