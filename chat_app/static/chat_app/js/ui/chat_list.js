import { setOrRemoveBadge, updateSectionBadge, formatBadgeCount } from "./unread_badges.js"

function getChatListContainer(isGroup) {
    const sections = document.querySelectorAll('.chats-section .messages-container .content-chats')
    return sections[isGroup ? 1 : 0] || null
}

function getChatListItem(chatId, isGroup = null) {
    if (isGroup !== null) {
        const container = getChatListContainer(Boolean(isGroup))
        return container ? container.querySelector(`.container-chat[data-chat-id="${chatId}"]`) : null
    }
    return document.querySelector(`.content-chats .container-chat[data-chat-id="${chatId}"]`)
}

function isChatActive(chatId) {
    return Boolean(document.querySelector(`.container-chat.active[data-chat-id="${chatId}"]`))
}

function formatChatTime(datetime) {
    if (!datetime) return ''
    return new Date(datetime).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
}

export function createChatListItem(data) {
    const item = document.createElement('div')
    const showUnread = data.unread_count > 0 && !isChatActive(data.chat_id)

    item.className = `container-chat${showUnread ? ' container-chat--unread' : ''}`
    item.dataset.chatId = data.chat_id

    if (data.user_id) {
        item.dataset.chatUser = data.user_id
        item.dataset.chatUsername = data.username || ''
    }

    const avatarSrc = data.avatar
        || (data.is_group ? '/static/chat_app/icons/people.svg' : '/static/chat_app/images/Avatar-1.png')
    const avatarWrapperClass = data.is_group
        ? 'chat-avatar-wrapper group-avatar-wrapper'
        : 'chat-avatar-wrapper'

    const badgeText = formatBadgeCount(data.unread_count)
    const multiClass = badgeText.length > 1 ? ' count-badge--multi' : ''
    const badgeHtml = showUnread
        ? `<span class="chat-unread-badge${multiClass}">${badgeText}</span>`
        : ''
    const onlineIndicatorHtml = data.user_id
        ? '<span class="online-indicator online-indicator--offline"></span>'
        : ''

    item.innerHTML = `
        <div class="${avatarWrapperClass}">
            <img src="${avatarSrc}" alt="${data.username || ''}">
            ${onlineIndicatorHtml}
            ${badgeHtml}
        </div>
        <div class="chat-info">
            <div>
                <h2>${data.username || (data.is_group ? 'Груповий чат' : 'Особистий чат')}</h2>
                <h3>${data.last_message || 'Немає повідомлень'}</h3>
            </div>
            <div>
                <p>${formatChatTime(data.last_message_time)}</p>
            </div>
        </div>
    `

    return item
}

export function updateHomeSidePanelItem(data) {
    window.updateHomeSidePanelItem?.(data)
}

export function ensureChatListItem(data) {
    const container = getChatListContainer(Boolean(data.is_group))
    if (!container) return null

    let item = container.querySelector(`.container-chat[data-chat-id="${data.chat_id}"]`)
    if (item) return item

    container.querySelector('.chat-list-empty')?.remove()
    item = createChatListItem(data)
    container.prepend(item)
    return item
}

export function moveChatListItemToTop(chatId, isGroup = null) {
    const item = getChatListItem(chatId, isGroup)
    if (item) {
        item.closest('.content-chats')?.prepend(item)
    }
}

export function reorderChatList(chats) {
    if (!Array.isArray(chats) || !chats.length) return

    const personalChats = chats.filter((chat) => !chat.is_group)
    const groupChats = chats.filter((chat) => chat.is_group)

    reorderSectionChats(getChatListContainer(false), personalChats)
    reorderSectionChats(getChatListContainer(true), groupChats)
}

export function reorderSectionChats(container, orderedChats) {
    if (!container || !orderedChats.length) return

    orderedChats
        .slice()
        .reverse()
        .forEach((chatData) => {
            const item = container.querySelector(`.container-chat[data-chat-id="${chatData.chat_id}"]`)
            if (item) {
                container.prepend(item)
            }
        })
}

export function bumpChatInList(chatId, messageData, isGroup = null) {
    if (!chatId || !messageData) return

    const isOwnMessage = messageData.sender === window.currentUserUsername
    const shouldShowUnread = !isOwnMessage && !isChatActive(chatId)
    const resolvedIsGroup = isGroup ?? window.currentChatIsGroup ?? false

    let item = getChatListItem(chatId, resolvedIsGroup)

    if (!item) {
        const chatTitle = document.getElementById('chat-title')?.textContent?.replace(/^Чат з\s+/, '').trim()

        item = ensureChatListItem({
            chat_id: chatId,
            is_group: Boolean(resolvedIsGroup),
            username: chatTitle || '',
            last_message: messageData.text || '',
            last_message_time: messageData.datetime,
            unread_count: shouldShowUnread ? 1 : 0,
        })
    }

    if (item) {
        const preview = item.querySelector('.chat-info h3')
        const time = item.querySelector('.chat-info > div:last-child p')

        if (preview) preview.textContent = messageData.text || (messageData.images?.length ? 'Зображення' : '')
        if (time) time.textContent = formatChatTime(messageData.datetime)

        if (shouldShowUnread) {
            item.classList.add('container-chat--unread')
            const currentBadge = item.querySelector('.chat-unread-badge')
            const currentCount = Number(currentBadge?.textContent) || 0
            setOrRemoveBadge(
                item.querySelector('.chat-avatar-wrapper'),
                currentCount + 1,
                'chat-unread-badge',
            )
        }
        
        item.closest('.content-chats')?.prepend(item)
    }
}

export function updateChatPageListItem(data, options = {}) {
    const { moveToTop = true } = options
    const shouldShowUnread = data.unread_count > 0 && !isChatActive(data.chat_id)

    const item = ensureChatListItem(data)

    if (item) {
        const preview = item.querySelector('.chat-info h3')
        const time = item.querySelector('.chat-info > div:last-child p')

        if (preview) preview.textContent = data.last_message || ''
        if (time) time.textContent = formatChatTime(data.last_message_time)

        item.classList.toggle('container-chat--unread', shouldShowUnread)
        setOrRemoveBadge(
            item.querySelector('.chat-avatar-wrapper'),
            shouldShowUnread ? data.unread_count : 0,
            'chat-unread-badge',
        )

        if (moveToTop) {
            item.closest('.content-chats')?.prepend(item)
        }
    }

    const sections = document.querySelectorAll('.chats-section .messages-container')
    if (sections[0] && data.personal_unread_count !== undefined) {
        updateSectionBadge(sections[0], data.personal_unread_count)
    }
    if (sections[1] && data.group_unread_count !== undefined) {
        updateSectionBadge(sections[1], data.group_unread_count)
    }
}

export function updateChatListItemMetadata(chatId, data) {
    const item = getChatListItem(chatId, true)
    if (!item) return

    const titleElement = item.querySelector('.chat-info h2')
    const avatarElement = item.querySelector('.chat-avatar-wrapper img')

    if (data.name && titleElement) {
        titleElement.textContent = data.name
    }

    if (data.avatar && avatarElement) {
        avatarElement.src = data.avatar
    }
}
