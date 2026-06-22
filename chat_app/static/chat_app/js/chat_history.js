import * as uiFunctions from "./ui/message_renderer.js"
import { getCurrentChatId, setCurrentUserUsername } from "./chat/state.js"

let historyObserver = null
const messagesContainer = document.getElementById("messages-users-container")
const historyState = {
    chatId: null,
    page: 1,
    hasOlder: false,
    loading: false,
}

export function resetHistoryState() {
    historyState.chatId = null
    historyState.page = 1
    historyState.hasOlder = false
    historyState.loading = false

    if (historyObserver) {
        historyObserver.disconnect()
        historyObserver = null
    }
}

export function ensureHistorySentinel() {
    if (!messagesContainer) return null
    
    let sentinel = document.getElementById('messages-history-sentinel')
    if (!sentinel) {
        sentinel = document.createElement('div')
        sentinel.id = 'messages-history-sentinel'
        sentinel.style.cssText = 'width:100%;height:1px;flex-shrink:0;'
        messagesContainer.prepend(sentinel)
    } else if (sentinel.parentElement !== messagesContainer) {
        // If sentinel exists but is not in the container, move it
        messagesContainer.prepend(sentinel)
    }
    return sentinel
}

export function setupChatHistory(chatId, data) {
    historyState.chatId = chatId ? String(chatId) : null
    historyState.page = data.page || 1
    historyState.hasOlder = Boolean(data.has_older)
    historyState.loading = false
    
    if (historyState.hasOlder) {
        initHistoryPagination()
    } else if (historyObserver) {
        historyObserver.disconnect()
        historyObserver = null
    }
}

export function initHistoryPagination() {
    const sentinel = ensureHistorySentinel()
    if (!sentinel) return

    if (historyObserver) {
        historyObserver.disconnect()
    }

    historyObserver = new IntersectionObserver(async ([entry]) => {
        if (!entry.isIntersecting || !historyState.hasOlder || historyState.loading) return
        
        const currentChatId = getCurrentChatId() ? String(getCurrentChatId()) : null
        if (historyState.chatId !== currentChatId) return

        historyState.loading = true
        
        try {
            const nextPage = historyState.page + 1
            await loadChatHistory(currentChatId, nextPage, { prepend: true })
        } catch (err) {
            console.warn('Failed to auto-load older messages:', err)
        } finally {
            historyState.loading = false
            
            if (!historyState.hasOlder && historyObserver) {
                historyObserver.disconnect()
                historyObserver = null
            }
        }
    }, {
        root: messagesContainer,
        rootMargin: '120px', 
    })

    historyObserver.observe(sentinel)
}

export async function loadChatHistory(chatId, page = 1, { prepend = false } = {}) {
    const strChatId = chatId ? String(chatId) : null
    if (!strChatId) return { success: false }

    try {
        const response = await fetch(`/chat/chat_history/${strChatId}/?page=${page}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
            },
        })
        const data = await response.json()

        if (!data.success) {
            console.warn('chat history error', data)
            if (!prepend) {
                uiFunctions.renderMessages([])
            }
            return data
        }

        const activeChatId = getCurrentChatId() ? String(getCurrentChatId()) : null
        if (activeChatId !== strChatId) return data

        if (data.current_user) {
            setCurrentUserUsername(data.current_user)
        }

        if (data.members) {
            window.setCurrentChatMembers?.(data.members)
        }

        try {
            if (prepend) {
                uiFunctions.prependMessages(data.messages || [])
                historyState.page = data.page || page
                historyState.hasOlder = Boolean(data.has_older)
            } else {
                uiFunctions.renderMessages(data.messages || [])
                setupChatHistory(strChatId, data)
            }
        } catch (renderErr) {
            console.error('Error rendering messages:', renderErr)
            if (!prepend) {
                uiFunctions.renderMessages([])
            }
            return { success: false, error: renderErr }
        }

        return data
    } catch (error) {
        console.error('Network error during chat history fetch:', error)
        if (!prepend) {
            uiFunctions.renderMessages([])
        }
        return { success: false, error }
    }
}
