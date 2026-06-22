import { escapeHTML } from "../utils/clear_html.js"

export function groupByLetter(users) {
    const excludedIds = window.currentGroupMemberIds || new Set()

    return users.reduce((acc, user) => {
        if (excludedIds.has(String(user?.id))) return acc

        const name = (user?.username || '').trim()
        if (!name) return acc

        const letter = name[0].toUpperCase()

        if (!acc[letter]) {
            acc[letter] = []
        }
        acc[letter].push(user)
        return acc
    }, {})
}

export function renderGroups(grouped, containerId = "contactsContainer") {
    const container = typeof containerId === 'string'
        ? document.getElementById(containerId)
        : containerId

    if (!container) {
        console.warn('renderGroups: container not found', {grouped, containerId})
        return
    }

    const currentlyCheckedIds = new Set(
        Array.from(container.querySelectorAll('.group-user-checkbox:checked')).map(cb => String(cb.value))
    )

    container.innerHTML = ""
    const mainFragment = document.createDocumentFragment()

    const sortedLetters = Object.keys(grouped).sort((a, b) => a.localeCompare(b, 'uk', { sensitivity: 'base' }))

    sortedLetters.forEach(letter => {
        grouped[letter].sort((a, b) => {
            const nameA = (a?.username || '').trim().toLowerCase()
            const nameB = (b?.username || '').trim().toLowerCase()
            return nameA.localeCompare(nameB, 'uk', { sensitivity: 'base' })
        })

        const groupEl = document.createElement("div")
        groupEl.className = "contacts-group"
        groupEl.innerHTML = `<p class="contacts-letter">${escapeHTML(letter)}</p>`

        grouped[letter].forEach(user => {
            const el = document.createElement("div")
            el.className = "people-contact-modal"
            el.dataset.userId = String(user.id)
            el.dataset.chatUsername = user.username

                const avatarUrl = user.avatar || '/static/chat_app/images/Avatar-1.png'
                const isChecked = currentlyCheckedIds.has(String(user.id)) ? 'checked' : ''
                const disabled = window.currentGroupMemberIds?.has(String(user.id)) ? 'disabled' : ''
                const disabledClass = window.currentGroupMemberIds?.has(String(user.id)) ? ' disabled-contact' : ''

                el.innerHTML = `
                    <img src="${escapeHTML(avatarUrl)}" alt="${escapeHTML(user.username)}">
                    <p class="contact-name">${escapeHTML(user.username)}</p>

                    <div class="checkbox-container">
                        <label class="input-checkbox">
                            <input type="checkbox"
                                class="group-user-checkbox"
                                name="users[]"
                                value="${String(user.id)}"
                                ${isChecked}
                                ${disabled}
                                data-avatar="${escapeHTML(avatarUrl)}">
                            <span class="checkmark"></span>
                        </label>
                    </div>
                `
                el.className += disabledClass
                groupEl.appendChild(el)
            })
            mainFragment.appendChild(groupEl)
        })

    container.appendChild(mainFragment)
}
