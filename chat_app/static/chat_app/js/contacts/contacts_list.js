import { filterUsers } from "./contacts_search.js"
import { escapeHTML } from "../utils/clear_html.js"

const contactsScroll = document.querySelector('.contacts-scroll')
const contactsList = contactsScroll?.querySelector('#contactsList')
const sentinel = contactsScroll?.querySelector('#contacts-sentinel')
const contactsSearchInput = document.getElementById('contacts-list-search')

if (sentinel) {
    sentinel.style.cssText = 'display:block; width:100%; height:2px; min-height:2px; flex-shrink:0;'
}

let page = 1
let loading = false
let hasNext = true
let allUsers = []
let searchDebounceTimeout = null

function createContactItem(user) {
    const item = document.createElement('div')
    item.className = 'people-contact-plain'
    item.dataset.chatUser = String(user.id)
    item.dataset.chatUsername = user.username
    item.innerHTML = `
        <div class="image-container">
            <img src="${escapeHTML(user.avatar || '/static/chat_app/images/Avatar-1.png')}" alt="${escapeHTML(user.username)}">
        </div>
        <div class="contact-info">
            <p class="contact-name">${escapeHTML(user.username)}</p>
        </div>
    `
    return item
}

function render(users) {
    if (!contactsList) return
    
    const fragment = document.createDocumentFragment()
    users.forEach(user => fragment.appendChild(createContactItem(user)))
    
    contactsList.innerHTML = ''
    contactsList.appendChild(fragment)
}

function renderSearchResults() {
    const query = contactsSearchInput?.value?.trim() || ''
    render(filterUsers(allUsers, query))
}

async function loadInitial() {
    try {
        const res = await fetch(`/chat/contacts/?page=1`)
        const data = await res.json()

        if (!data.success) return

        allUsers = data.results || []
        hasNext = Boolean(data.has_next)
        page = 1

        renderSearchResults()
    } catch (err) {
        console.warn('Initial contacts load failed', err)
    }
}

async function loadPage(nextPage, { renderAfterLoad = true } = {}) {
    if (loading || !hasNext) return false

    loading = true

    try {
        const res = await fetch(`/chat/contacts/?page=${nextPage}`)
        const data = await res.json()

        if (!data.success) {
            hasNext = false
            return false
        }

        const newUsers = data.results || []
        allUsers = [...allUsers, ...newUsers]
        hasNext = Boolean(data.has_next)
        page = nextPage

        if (renderAfterLoad) {
            if (contactsList && (!contactsSearchInput || !contactsSearchInput.value.trim())) {
                const fragment = document.createDocumentFragment()
                newUsers.forEach(user => fragment.appendChild(createContactItem(user)))
                contactsList.appendChild(fragment)
            } else {
                renderSearchResults()
            }
        }
        return true
    } catch (error) {
        console.error("Error loading contacts page:", error)
        hasNext = false 
        return false
    } finally {
        loading = false
    }
}

async function loadAllContacts() {
    if (!hasNext || loading) return

    while (hasNext) {
        const success = await loadPage(page + 1, { renderAfterLoad: false })
        if (!success) break 
    }
    renderSearchResults()
}

const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting || loading || !hasNext) return
    
    if (contactsSearchInput && contactsSearchInput.value.trim()) return

    await loadPage(page + 1)
}, {
    root: contactsScroll,
    rootMargin: '150px'
})

if (sentinel) {
    observer.observe(sentinel)
}

loadInitial()

contactsSearchInput?.addEventListener('input', (event) => {
    if (searchDebounceTimeout) {
        clearTimeout(searchDebounceTimeout)
    }

    searchDebounceTimeout = setTimeout(async () => {
        const value = event.target.value.trim()
        if (value) {
            await loadAllContacts()
        } else {
            renderSearchResults()
        }
    }, 350)
})

window.ensureContactVisible = async function(userId) {
    if (!contactsList) return null

    const find = () => contactsList.querySelector(`[data-chat-user="${userId}"]`)
    const target = find()
    if (target) return target

    while (hasNext) {
        const success = await loadPage(page + 1, { renderAfterLoad: true })
        if (!success) break
        
        const el = find()
        if (el) {
            requestAnimationFrame(() => {
                try { el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) } catch(e){}
            })
            return el
        }
    }

    return null
}
