import { getCSRFToken } from "/static/user_app/js/utils.js"
import { loadChatHistory, resetHistoryState } from "../chat_history.js"
import { findPersonalChatItem, setActiveChat, setActiveContact } from "../ui/active_chat.js"
import { getDefaultGroupAvatar } from "../ui/group_avatar.js"
import { renderMessages, scrollToBottom } from "../ui/message_renderer.js"
import { clearChatUnreadBadges, updateSectionUnreadBadges } from "../ui/unread_badges.js"
import { connectWebSocket } from "./chat_socket.js"
import { getChatSocket, setChatSocket, setCurrentChatId, setCurrentChatIsGroup, setCurrentUserUsername, getCurrentChatId, getCurrentChatTotalMembers, setCurrentChatTotalMembers } from "./state.js"

const chatTitle = document.getElementById("chat-title")
const chatStatus = document.getElementById("chat-status")
const chatHeaderImage = document.getElementById('group-header-avatar')
const DEFAULT_GROUP_AVATAR = getDefaultGroupAvatar()
const DEFAULT_USER_AVATAR = '/static/chat_app/images/Avatar-1.png'
const contactsContainer = document.getElementById('contactsContainer')
const chatsSection = document.querySelector('.chats-section')

let onlineUserIds = new Set()
let currentLoadingChatId = null

function getPluralForm(number, one, two, five) {
    const n = Math.abs(number) % 100
    const n1 = n % 10
    if (n > 10 && n < 20) return five
    if (n1 > 1 && n1 < 5) return two
    if (n1 === 1) return one
    return five
}

export function setOnlineUserIds(userIds) {
    onlineUserIds = new Set((userIds || []).map(String))
}

export function isUserOnline(userId) {
    return onlineUserIds.has(String(userId))
}

function getGroupOnlineCount() {
    const members = Array.isArray(window.currentChatMembers) ? window.currentChatMembers : []
    let onlineCount = 0
    const countedUsers = new Set()

    members.forEach(member => {
        const userId = String(member?.id || member?.user_id || member)
        if (userId && !countedUsers.has(userId)) {
            countedUsers.add(userId)
            if (isUserOnline(userId)) {
                onlineCount++
            }
        }
    })

    return onlineCount
}

export function updateChatStatus(userId = null, isGroup = false) {
    if (!chatStatus) return

    if (isGroup) {
        const total = getCurrentChatTotalMembers()
        const online = getGroupOnlineCount()
        
        const membersWord = getPluralForm(total, 'учасник', 'учасники', 'учасників')
        
        chatStatus.textContent = `${total} ${membersWord}, ${online} в мережі`
        
        if (online > 0) {
            chatStatus.classList.add("online")
        } else {
            chatStatus.classList.remove("online")
        }
    } else if (userId) {
        const online = isUserOnline(userId)
        if (online) {
            chatStatus.textContent = "В мережі"
            chatStatus.classList.add("online")
        } else {
            chatStatus.textContent = "Не в мережі"
            chatStatus.classList.remove("online")
        }
    }
}

function toggleChatContainers(showChat) {
    const messageInfoContainer = document.getElementById("message-info-container")
    const messagesContainer = document.getElementById("messages-container")
    
    if (messageInfoContainer) messageInfoContainer.style.display = showChat ? "none" : "flex"
    if (messagesContainer) messagesContainer.style.display = showChat ? "flex" : "none"
}

const backButtonHeaderChat = document.getElementById('back-button-header-chat')

function closeChat() {
    const socket = getChatSocket()
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close()
    }
    setChatSocket(null)
    resetHistoryState()
    setCurrentChatId(null)
    setCurrentChatIsGroup(false)
    toggleChatContainers(false)

    if (chatTitle) chatTitle.textContent = ''
    if (chatStatus) {
        chatStatus.textContent = ''
        chatStatus.classList.remove("online")
    }
}

if (backButtonHeaderChat) {
    backButtonHeaderChat.addEventListener('click', function(event) {
        event.preventDefault()
        closeChat()
    })
}

export async function openChatWithUser(userId, username) {
    const loadingTargetId = `user_${userId}`
    currentLoadingChatId = loadingTargetId

    try {
        const response = await fetch(`/chat/chat_with/${userId}/`, {
            method: 'POST',
            headers: {
                "X-CSRFToken": getCSRFToken(),
            }
        })
        const data = await response.json()

        if (currentLoadingChatId !== loadingTargetId) return

        if (!data.success) return

        toggleChatContainers(true)

        if (chatTitle) chatTitle.textContent = `Чат з ${data.username || username}`
        updateChatStatus(userId, false)
        
        window.currentChatIsAdmin = false

        if (data.current_user) {
            setCurrentUserUsername(data.current_user)
        }

        const personalAvatar = document.querySelector(`.people-contact-plain[data-chat-user="${userId}"] img`)?.src
            || findPersonalChatItem(userId)?.querySelector('.chat-avatar-wrapper img')?.src

        setChatHeaderAvatar(personalAvatar, DEFAULT_USER_AVATAR)
        setCurrentChatIsGroup(false)
        
        connectWebSocket(data.chat_id, false)
        await loadChatHistory(data.chat_id, 1)
        
        clearChatUnreadBadges(data.chat_id)
        updateSectionUnreadBadges()
    } catch (error) {
        console.error('Failed to open personal chat:', error)
    }
}

export async function handleChatOpen(event) {
    if (event.target.closest('.people-contact-modal, .group-container, #form-chat, .messages-container-main')) return

    const target = event.target.closest('[data-chat-user]') || event.target.closest('.container-chat')
    if (!target) return

    const userId = target.dataset.chatUser
    const username = target.dataset.chatUsername
    const chatId = target.dataset.chatId ? String(target.dataset.chatId).trim() : null

    const activeChatId = getCurrentChatId()
    if (chatId && activeChatId && chatId === String(activeChatId)) {
        return
    }

    const chatItem = target.closest('.container-chat')
        || findPersonalChatItem(userId)
        || (chatId ? document.querySelector(`.content-chats .container-chat[data-chat-id="${chatId}"]`) : null)

    if (userId) {
        if (typeof window.ensureContactVisible === 'function') {
            try {
                await window.ensureContactVisible(userId)
            } catch (err) {
                console.warn('ensureContactVisible failed', err)
            }
        }
        setActiveContact(userId)

        if (chatItem) {
            setActiveChat(chatItem)
        }

        openChatWithUser(userId, username)
        return
    }

    if (chatItem) {
        setActiveChat(chatItem)
    }

    if (chatId && !userId) {
        const loadingTargetId = `chat_${chatId}`
        currentLoadingChatId = loadingTargetId

        const titleEl = chatItem?.querySelector('h2, h1, .chat-info h2')
        const title = titleEl ? titleEl.textContent.trim() : 'Груповий чат'
        const listAvatar = chatItem?.querySelector('.chat-avatar-wrapper img')?.src

        if (chatTitle) chatTitle.textContent = title
        setChatHeaderAvatar(listAvatar, DEFAULT_GROUP_AVATAR)
        
        window.currentChatIsAdmin = false
        
        toggleChatContainers(true)
        setCurrentChatIsGroup(true)
        connectWebSocket(chatId, true)

        try {
            const data = await loadChatHistory(chatId, 1)
            
            if (currentLoadingChatId !== loadingTargetId) return

            if (data && data.success) {
                setChatHeaderAvatar(data.avatar || listAvatar, DEFAULT_GROUP_AVATAR)
                window.currentChatIsAdmin = Boolean(data.is_admin)
                
                if (data.current_user) {
                    setCurrentUserUsername(data.current_user)
                }

                // Записываем количество участников из бэкенда и обновляем счетчик
                if (data.total_members) {
                    setCurrentChatTotalMembers(data.total_members)
                }
                updateChatStatus(null, true)
                
                clearChatUnreadBadges(chatId)
                updateSectionUnreadBadges()
            }
        } catch (err) {
            console.warn('failed to fetch chat history', err)
            if (currentLoadingChatId === loadingTargetId) {
                renderMessages([])
            }
        }
    }
}

if (contactsContainer) {
    contactsContainer.addEventListener("click", handleChatOpen)
    contactsContainer.addEventListener("dblclick", handleChatDoubleClick)
}

if (chatsSection) {
    chatsSection.addEventListener("click", handleChatOpen)
    chatsSection.addEventListener("dblclick", handleChatDoubleClick)
}

function handleChatDoubleClick(event) {
    const target = event.target.closest('[data-chat-user]') || event.target.closest('.container-chat')
    if (!target) return

    const activeChatId = getCurrentChatId()
    const chatId = target.dataset.chatId ? String(target.dataset.chatId).trim() : null
    if (!chatId || !activeChatId || chatId !== String(activeChatId)) return

    scrollToBottom(true)
}

export function setChatHeaderAvatar(avatarUrl, fallback = DEFAULT_GROUP_AVATAR) {
    if (!chatHeaderImage) return
    chatHeaderImage.src = avatarUrl || fallback
}

// Auto-open chat if user_id is provided in query parameters
document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search)
    const userId = params.get('user_id')
    
    if (userId) {
        // Remove the query parameter from the URL
        window.history.replaceState({}, document.title, window.location.pathname)
        
        // Open the chat with the user after a small delay to ensure everything is loaded
        setTimeout(() => {
            openChatWithUser(userId)
        }, 100)
    }
})
