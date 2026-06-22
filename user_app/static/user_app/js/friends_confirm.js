const profileContainer = document.getElementById("profileContent")
const profileContent = profileContainer
const friendsMainContent = document.getElementById("friends-main-content")
const friendPostsView = document.getElementById("friend-posts-view")
const friendPostsTitle = document.getElementById("friend-posts-title")
const friendPostsBack = document.getElementById("friend-posts-back")
const friendsNav = document.querySelector(".friends-nav-content")

let friendPostsObserver = null
let friendPostsPage = 1
let friendPostsHasNext = false
let friendPostsUserId = null

function resetFriendPostsLoader() {
    if (friendPostsObserver) {
        friendPostsObserver.disconnect()
        friendPostsObserver = null
    }

    friendPostsPage = 1
    friendPostsHasNext = false
    friendPostsUserId = null
}

function initFriendPostsLoader(userId, hasNext) {
    resetFriendPostsLoader()

    friendPostsUserId = userId
    friendPostsHasNext = Boolean(hasNext)
    friendPostsPage = 1

    const loaderLine = friendPostsView?.querySelector("#postLoaderLine")
    if (!loaderLine || !friendPostsHasNext) return

    friendPostsObserver = new IntersectionObserver(async ([entry]) => {
        if (!entry.isIntersecting || !friendPostsHasNext || !friendPostsUserId) return

        const nextPage = friendPostsPage + 1
        const response = await fetch(
            `/friends/profile/${friendPostsUserId}/?page=${nextPage}`,
            {
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                },
            },
        )
        const data = await response.json()

        if (!data.success || !data.html) {
            friendPostsHasNext = false
            friendPostsObserver?.disconnect()
            return
        }

        loaderLine.insertAdjacentHTML("beforebegin", data.html)
        friendPostsPage = nextPage
        friendPostsHasNext = data.has_next

        if (!friendPostsHasNext) {
            friendPostsObserver?.disconnect()
        }
    }, { rootMargin: "200px" })

    friendPostsObserver.observe(loaderLine)
}

function renderFriendPosts(data) {
    const postList = friendPostsView?.querySelector(".post-list")
    if (!postList) return

    const postsHtml = data.posts_html || '<p class="empty-note">Дописів поки немає</p>'
    postList.innerHTML = `${postsHtml}<div id="postLoaderLine" style="width: 100%; height: 1px;"></div>`

    if (friendPostsTitle && data.username) {
        friendPostsTitle.textContent = `Дописи @${data.username}`
    }

    initFriendPostsLoader(data.user_id, data.has_next)
}

function showFriendPostsView() {
    if (friendsMainContent) {
        friendsMainContent.style.display = "none"
    }

    if (friendPostsView) {
        friendPostsView.style.display = "flex"
    }
}

export function restoreFriendsContent() {
    resetFriendPostsLoader()

    const postList = friendPostsView?.querySelector(".post-list")
    if (postList) {
        postList.innerHTML = '<div id="postLoaderLine" style="width: 100%; height: 1px;"></div>'
    }

    if (friendPostsTitle) {
        friendPostsTitle.textContent = "Дописи користувача"
    }

    if (friendPostsView) {
        friendPostsView.style.display = "none"
    }

    if (friendsMainContent) {
        friendsMainContent.style.display = "flex"
    }

    if (friendsNav) {
        friendsNav.style.display = "flex"
    }
}

function closeFriendProfileView() {
    if (typeof window.closeFriendProfile === "function") {
        window.closeFriendProfile()
        return
    }

    restoreFriendsContent()
}

document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".open-profile-btn")
    if (!btn) return

    const section = btn.dataset.section
    const userId = btn.dataset.userId

    const response = await fetch(`/friends/profile/${userId}/?section=${section}`, {
        headers: {
            "X-Requested-With": "XMLHttpRequest",
        },
    })
    const data = await response.json()

    if (friendsNav) {
        friendsNav.style.display = "none"
    }

    showFriendPostsView()
    profileContent.innerHTML = data.html
    renderFriendPosts(data)

    if (typeof window.connectFRiendActionButtons === "function") {
        window.connectFRiendActionButtons(profileContent)
    }

    profileContainer.style.display = "flex"
})

friendPostsBack?.addEventListener("click", closeFriendProfileView)

window.restoreFriendsContent = restoreFriendsContent
window.showFriendPostsView = showFriendPostsView
