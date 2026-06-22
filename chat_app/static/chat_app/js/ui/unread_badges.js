import { getCSRFToken } from "/static/user_app/js/utils.js"

export function formatBadgeCount(count) {
    const value = Number(count) || 0
    return value > 99 ? '99+' : String(value)
}

export async function markChatAsRead(chatId) {
    if (!chatId) return

    try {
        const response = await fetch(`/chat/mark_read/${chatId}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
            },
        })
        const data = await response.json()

        clearChatUnreadBadges(chatId)

        if (data.success && typeof window.applyChatUnreadStatus === 'function') {
            window.applyChatUnreadStatus(data)
        } else {
            updateSectionUnreadBadges()
        }
    } catch (error) {
        console.warn('mark chat read failed', error)
    }
}

export function clearChatUnreadBadges(chatId) {
    document.querySelectorAll(`.container-chat[data-chat-id="${chatId}"]`).forEach((chatItem) => {
        chatItem.classList.remove('container-chat--unread')
        chatItem.querySelector('.chat-unread-badge')?.remove()
    })
}

export function updateSectionUnreadBadges() {
    document.querySelectorAll('.messages-container').forEach((section) => {
        const sectionBadge = section.querySelector('.chat-section-icon-badge')
        const chatBadges = section.querySelectorAll('.chat-unread-badge')

        if (!sectionBadge && chatBadges.length === 0) {
            return
        }

        let total = 0
        chatBadges.forEach((badge) => {
            const exactCount = badge.dataset.rawCount 
                ? Number(badge.dataset.rawCount) 
                : null
            
            if (exactCount !== null) {
                total += exactCount
            } else {
                const value = badge.textContent.trim()
                total += value.endsWith('+') ? 100 : Number(value) || 0
            }
        })

        if (total > 0) {
            if (sectionBadge) {
                applyBadgeText(sectionBadge, total)
            }
            return
        }

        sectionBadge?.remove()
    })
}

export function applyBadgeText(badge, count) {
    if (!badge) return

    const text = formatBadgeCount(count)
    badge.textContent = text
    
    badge.dataset.rawCount = String(count)
    badge.classList.toggle('count-badge--multi', text.length > 1)
}

function manageBadgeLifecycle(container, count, badgeClass) {
    if (!container) return

    const existingBadge = container.querySelector(`.${badgeClass}`)

    if (count > 0) {
        const badge = existingBadge || document.createElement('span')
        badge.className = badgeClass
        applyBadgeText(badge, count)
        if (!existingBadge) {
            container.appendChild(badge)
        }
        return
    }

    existingBadge?.remove()
}

export function setOrRemoveBadge(avatarWrapper, count, badgeClass) {
    manageBadgeLifecycle(avatarWrapper, count, badgeClass)
}

export function updateSectionBadge(section, count) {
    const wrapper = section?.querySelector('.chat-section-icon-wrapper')
    manageBadgeLifecycle(wrapper, count, 'chat-section-icon-badge')
}

export function updateHomeIconBadge(count) {
    const sidePanelMessages = document.getElementById('sidePanelMessages')
    if (!sidePanelMessages) return
    
    const iconWrapper = sidePanelMessages.querySelector('.side-panel-icon-wrapper')
    manageBadgeLifecycle(iconWrapper, count, 'side-panel-icon-badge')
}

export function updateHeaderMessagesBadge(count) {
    const iconWrapper = document.getElementById('headerMessagesIcon')
    manageBadgeLifecycle(iconWrapper, count, 'header-icon-badge')
}
