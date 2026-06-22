import { getCSRFToken } from "./utils.js";

const csrfToken = getCSRFToken()

const homeFriendsList = document.querySelector('[data-home-section= "friends"]')
const profileContainer = document.getElementById("profileContent")
const profileContent = profileContainer

async function handlerFriendAction(actionButton) {
    const response = await fetch(actionButton.dataset.url, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
            'X-Requested-With': 'XMLHttpRequest',
        },
    })

    const data = await response.json()

    if (!data.success) {
        console.warn('friend action failed', data.errors)
        return
    }

    if (profileContainer?.style.display === 'flex') {
        closeProfile()
    }

    window.location.reload()
}

function addFriendToHome(frienHtml){
    const friendCount = homeFriendsList.querySelectorAll('article').length
    if (friendCount >= 6){
        return 
    }

    homeFriendsList.querySelector('p')?.remove()
    homeFriendsList.insertAdjacentHTML('beforeend', frienHtml)

    connectFRiendActionButtons(homeFriendsList)
}

function connectFRiendActionButtons(parent = document) {
    const actionButton = parent.querySelectorAll('[data-friend-action]')
    actionButton.forEach((actionbutton) => {
        if (actionbutton.dataset.actionbutton) {
            return
        }
        actionbutton.dataset.actionbutton = true
        actionbutton.addEventListener(
            'click', 
            () => handlerFriendAction(actionbutton)
        )
    })
}

window.connectFRiendActionButtons = connectFRiendActionButtons

connectFRiendActionButtons()

function closeProfile() {
    profileContainer.style.display = "none"
    profileContent.innerHTML = ""

    if (typeof window.restoreFriendsContent === 'function') {
        window.restoreFriendsContent()
    } else {
        document.getElementById("friends-home").style.display = "flex"
        document.querySelector(".friends-nav-content").style.display = "flex"
    }
}

window.closeFriendProfile = closeProfile
