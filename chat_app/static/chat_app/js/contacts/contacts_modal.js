import {
    saveCache,
    loadCache
} from "../utils/cache.js"

import {
    initModalContactsSearch,
    renderModalContacts,
    setContactsSearchUsers
} from "./contacts_search.js"

let allUsers = []
let page = 1
let loading = false
let hasNext = true

let modalObserver = null

function getActiveModal() {
    return document.querySelector('.group[data-contacts-modal-type]:not([style*="display: none"])') || document.querySelector('.group[data-contacts-modal-type]')
}

function getContactsScroll() {
    return getActiveModal()?.querySelector('.contacts-modal-scroll') || document.querySelector('.contacts-modal-scroll')
}

function getContactsContainer() {
    return getActiveModal()?.querySelector('.contacts-modal-container') || document.querySelector('.contacts-modal-container')
}

function getContactsSearchInput() {
    return getActiveModal()?.querySelector('.contacts-search') || document.querySelector('.contacts-search')
}

function getContactsSentinel() {
    return getActiveModal()?.querySelector('.contacts-modal-sentinel') || document.querySelector('.contacts-modal-sentinel')
}

async function loadPage(p = 1) {
    if (loading || !hasNext) return false

    loading = true

    try {
        const res = await fetch(`/chat/contacts-modal/?page=${p}`)
        const data = await res.json()

        if (!data.success) {
            hasNext = false
            return false
        }

        if (p == 1) {
            allUsers = data.results || []
        } else {
            allUsers.push(...(data.results || []))
        }

        hasNext = Boolean(data.has_next)
        page = p

        saveCache(allUsers)
        setContactsSearchUsers(allUsers)
        renderModalContacts()
        
        return true
    } catch (error) {
        console.error('Failed to load modal contacts page:', error)
        hasNext = false
        return false
    } finally {
        loading = false
    }
}

async function loadAllModalContacts() {
    if (!hasNext || loading) return

    while (hasNext) {
        const success = await loadPage(page + 1)
        if (!success) break
    }
}

initModalContactsSearch({ loadAllUsers: loadAllModalContacts })

function openContactsModal() {
    const groupContainer = document.querySelector(".group-container")
    if (groupContainer) {
        groupContainer.style.display = "flex"
    }
    const createGroupEl = document.getElementById("create-group")
    if (createGroupEl) createGroupEl.style.display = "flex"

    const cached = loadCache()

    if (cached && cached.length) {
        allUsers = cached
        hasNext = false
        
        setContactsSearchUsers(allUsers)
        renderModalContacts(getContactsSearchInput()?.value || '')
        
        const sentinel = getContactsSentinel()
        if (sentinel) sentinel.style.display = 'none'
        return
    }

    allUsers = []
    setContactsSearchUsers(allUsers)
    page = 1
    hasNext = true

    const contactsContainer = getContactsContainer()
    if (contactsContainer) contactsContainer.innerHTML = ""

    const sentinel = getContactsSentinel()
    const scrollRoot = getContactsScroll()
    if (sentinel && scrollRoot) {
        sentinel.style.cssText = 'display:block; width:100%; height:2px; min-height:2px; flex-shrink:0;'

        if (modalObserver) {
            modalObserver.disconnect()
        }

        modalObserver = new IntersectionObserver(async ([entry]) => {
            if (!entry.isIntersecting || loading || !hasNext) return
            await loadPage(page + 1)
        }, {
            root: scrollRoot,
            rootMargin: '150px'
        })

        try {
            modalObserver.observe(sentinel)
        } catch (error) {
            console.warn('modal observer observe failed', error, sentinel)
        }
    }

    loadPage(1)
}

document.addEventListener("click", (e) => {
    const modalContact = e.target.closest(".people-contact-modal")
    
    if (modalContact) {
        e.stopPropagation()

        const checkbox = modalContact.querySelector(".group-user-checkbox")
        if (checkbox && e.target !== checkbox) {
            if (checkbox.disabled) return
            e.preventDefault()
            checkbox.checked = !checkbox.checked
            
            checkbox.dispatchEvent(new Event("change", { bubbles: true }))
        }
        return
    }

    if (e.target.closest("#create-group-btn")) {
        openContactsModal()
    }
})

export async function ensureContactsLoaded() {
    const cached = loadCache()
    if (cached && cached.length) {
        allUsers = cached
        hasNext = false
        setContactsSearchUsers(allUsers)
        renderModalContacts(getContactsSearchInput()?.value || '')
        return
    }

    allUsers = []
    setContactsSearchUsers(allUsers)
    page = 1
    hasNext = true

    const contactsContainer = getContactsContainer()
    if (contactsContainer) contactsContainer.innerHTML = ""
    await loadPage(1)
}

window.ensureContactsLoaded = ensureContactsLoaded
