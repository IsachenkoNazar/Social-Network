import { groupByLetter, renderGroups } from "./contacts_renderer.js"

let modalUsers = []
let loadAllModalUsers = null
let searchTimeoutId = null

function getActiveContactsSearchInput() {
    const visibleModal = document.querySelector('.group[data-contacts-modal-type]:not([style*="display: none"])')
    return visibleModal?.querySelector('.contacts-search') || document.querySelector('.contacts-search')
}

function getActiveContactsContainer() {
    const visibleModal = document.querySelector('.group[data-contacts-modal-type]:not([style*="display: none"])')
    return visibleModal?.querySelector('.contacts-modal-container') || document.querySelector('.contacts-modal-container')
}

export function setContactsSearchUsers(users) {
    modalUsers = users || []
}

export function normalizeSearchText(value) {
    return (value || '').trim().toLowerCase()
}

export function filterUsers(users, searchText) {
    const query = normalizeSearchText(searchText)
    if (!query) return users || []

    return (users || []).filter((user) => {
        return (user.username || '').toLowerCase().includes(query)
    })
}

export function renderModalContacts(searchText = getActiveContactsSearchInput()?.value || '') {
    const filteredUsers = filterUsers(modalUsers, searchText).filter((user) => {
        return !window.currentGroupMemberIds?.has(String(user.id))
    })

    renderGroups(
        groupByLetter(filteredUsers),
        getActiveContactsContainer(),
    )
}

export function initModalContactsSearch({ loadAllUsers } = {}) {
    loadAllModalUsers = loadAllUsers || null
}

document.addEventListener('input', (e) => {
    if (!e.target.matches('.contacts-search')) return

    const targetValue = e.target.value

    renderModalContacts(targetValue)

    if (searchTimeoutId) {
        clearTimeout(searchTimeoutId)
    }

    searchTimeoutId = setTimeout(async () => {
        if (normalizeSearchText(targetValue) && typeof loadAllModalUsers === 'function') {
            try {
                await loadAllModalUsers()
            } catch (error) {
                console.warn('Failed to pre-load all modal users during search:', error)
            } finally {
                renderModalContacts(targetValue)
            }
        }
    }, 350)
})
