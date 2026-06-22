import { 
    connectNotificationWebSocket, 
    pollUnreadStatus
} from "./websocket/notification_socket.js"

async function initializeNotifications() {
    // Дождись загрузки DOM
    if (document.readyState === 'loading') {
        return
    }
    
    console.log('[Chat Notifications] Initializing...')
    console.log('[Chat Notifications] sidePanelMessages exists:', !!document.getElementById('sidePanelMessages'))
    
    try {
        await pollUnreadStatus()
        console.log('[Chat Notifications] Initial poll completed')
    } catch (err) {
        console.warn('[Chat Notifications] Initial unread status poll failed:', err)
    }
    
    connectNotificationWebSocket()
    console.log('[Chat Notifications] WebSocket connected')
}

// Если DOM уже загружен, инициализируй сразу
if (document.readyState !== 'loading') {
    initializeNotifications()
} else {
    // Иначе подожди события загрузки
    document.addEventListener('DOMContentLoaded', initializeNotifications)
}

// При закрытии страницы отправь последний опрос
window.addEventListener('beforeunload', () => {
    try {
        fetch('/chat/unread_status/')
    } catch (e) {}
})


