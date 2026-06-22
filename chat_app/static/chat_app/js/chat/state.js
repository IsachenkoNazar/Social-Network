let chatSocket = null
let currentChatId = null
let currentUserUsername = null
let currentChatIsGroup = false
let currentChatTotalMembers = 2

window.currentUserUsername = null
window.currentChatIsGroup = false
window.currentChatId = null
window.currentChatTotalMembers = currentChatTotalMembers

export function getCurrentChatTotalMembers() {
    return currentChatTotalMembers || window.currentChatTotalMembers || 2
}

export function setCurrentChatTotalMembers(count) {
    const value = Number(count) || 2
    currentChatTotalMembers = value
    window.currentChatTotalMembers = value
}

export function getChatSocket() {
    return chatSocket
}

export function setChatSocket(socket) {
    chatSocket = socket
}

export function getCurrentChatId() {
    const id = currentChatId || window.currentChatId
    return id ? String(id) : null
}

export function setCurrentChatId(chatId) {
    const cleanId = chatId ? String(chatId).trim() : null
    currentChatId = cleanId
    window.currentChatId = cleanId
}

export function getCurrentUserUsername() {
    return currentUserUsername || window.currentUserUsername || null
}

export function setCurrentUserUsername(username) {
    currentUserUsername = username
    window.currentUserUsername = username
}

export function getCurrentChatIsGroup() {
    return currentChatIsGroup
}

export function setCurrentChatIsGroup(isGroup) {
    currentChatIsGroup = Boolean(isGroup)
    window.currentChatIsGroup = currentChatIsGroup
}
