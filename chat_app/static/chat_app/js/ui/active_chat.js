export function scrollElementIntoView(element) {
    if (!element) return

    element.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
    })
}

export function scrollChatIntoView(chatElement) {
    scrollElementIntoView(chatElement)
}

export function findPersonalChatItem(userId) {
    if (!userId) return null
    const personalChatsList = document.querySelector('.chats-section .messages-container .content-chats')

    return personalChatsList?.querySelector(`.container-chat[data-chat-user="${userId}"]`) ?? null
}

export function setActiveChat(element) {
    const currentActive = document.querySelector('.content-chats .container-chat.active')
    if (currentActive === element) return

    if (currentActive) {
        currentActive.classList.remove('active')
    }

    if (element) {
        element.classList.add('active')
        scrollElementIntoView(element)
    }
}

export function setActiveContact(userId) {
    if (!userId) return

    const currentActive = document.querySelector('.people-contact-plain.active')
    const nextActive = document.querySelector(`.people-contact-plain[data-chat-user="${userId}"]`)
    
    if (currentActive === nextActive) return

    if (currentActive) {
        currentActive.classList.remove('active')
    }

    if (nextActive) {
        nextActive.classList.add('active')
        scrollElementIntoView(nextActive)
    }
}
