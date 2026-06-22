import { connectPresenceWebSocket, pollOnlineStatus, startPresencePolling } from "./websocket/presence_socket.js"
import {
    applyUnreadStatus,
    connectNotificationWebSocket,
    pollUnreadStatus,
} from "./websocket/notification_socket.js"
import { bumpChatInList } from "./ui/chat_list.js"

import "./ui/group_avatar.js"
import "./contacts/contacts_list.js"
import "./contacts/contacts_search.js"
import "./contacts/contacts_modal.js"
import "./group/selected_users.js"
import "./group/create_group.js"
import "./group/edit_group.js"
import "./chat/chat_open.js"
import "./chat/chat_form.js"

const sidePanelContainer = document.querySelector(".side-panel-container")
if (sidePanelContainer) {
    sidePanelContainer.style.display = "none"
}

window.applyChatUnreadStatus = applyUnreadStatus
window.bumpChatInList = bumpChatInList

pollOnlineStatus()
pollUnreadStatus()

connectPresenceWebSocket()
connectNotificationWebSocket()