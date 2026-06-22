import { resetHistoryState } from "../chat_history.js"
import { getMessageData, renderMessage } from "../ui/message_renderer.js"
import { clearChatUnreadBadges, updateSectionUnreadBadges, updateHeaderMessagesBadge, updateHomeIconBadge } from "../ui/unread_badges.js"
import {
    getChatSocket,
    getCurrentChatId,
    getCurrentChatIsGroup,
    setChatSocket,
    setCurrentChatId,
    setCurrentChatIsGroup,
} from "./state.js"


const PING_INTERVAL_MS = 25000 
let chatPingIntervalId = null

export function connectWebSocket(chatId, isGroup = getCurrentChatIsGroup()) {
    setCurrentChatId(chatId)
    setCurrentChatIsGroup(isGroup)

    if (chatPingIntervalId) {
        clearInterval(chatPingIntervalId)
        chatPingIntervalId = null
    }

    const existingSocket = getChatSocket()
    if (existingSocket) {
        resetHistoryState()
        existingSocket.onclose = null 
        existingSocket.close()
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const socket = new WebSocket(`${protocol}//${window.location.host}/chat/${chatId}/`)
    setChatSocket(socket)

    socket.onopen = function() {
        chatPingIntervalId = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'ping' }))
            }
        }, PING_INTERVAL_MS)
    }

       socket.onmessage = function(event) {
        const data = JSON.parse(event.data)
        const currentChatId = getCurrentChatId()

        if (data.type === "connection_established" || data.type === "pong") {
            return
        }

        renderMessage(data)

        const messageData = getMessageData(data)
        if (typeof window.bumpChatInList === 'function') {
            window.bumpChatInList(currentChatId, messageData, getCurrentChatIsGroup())
        }

        clearChatUnreadBadges(currentChatId)
        
        updateSectionUnreadBadges()

        let totalUnreadRemaining = 0
        document.querySelectorAll('.chat-unread-badge').forEach(badge => {
            const rawCount = badge.dataset.rawCount ? Number(badge.dataset.rawCount) : Number(badge.textContent) || 0
            totalUnreadRemaining += rawCount
        })

        updateHeaderMessagesBadge(totalUnreadRemaining)
        updateHomeIconBadge(totalUnreadRemaining)
    }

    socket.onclose = function() {
        if (chatPingIntervalId) {
            clearInterval(chatPingIntervalId)
            chatPingIntervalId = null
        }
    }
}

export function sendChatMessage(message) {
    const socket = getChatSocket()
    if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message))
    }
}

window.addEventListener('beforeunload', () => {
    if (chatPingIntervalId) {
        clearInterval(chatPingIntervalId)
    }
    const socket = getChatSocket()
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close()
    }
})
