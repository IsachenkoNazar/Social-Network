import { escapeHTML } from "../utils/clear_html.js"

export function renderSelectedUsers(selectedCheckboxes) {
    const container = document.querySelector(".members-list-view")
    if (!container) {
        console.warn('renderSelectedUsers: .members-list-view not found')
        return
    }

    container.innerHTML = ""

    const fragment = document.createDocumentFragment()

    selectedCheckboxes.forEach(cb => {
        const card = cb.closest('.card-member, .people-contact-modal, .people-contact-plain')
        if (!card) {
            console.warn('renderSelectedUsers: card not found for checkbox', cb)
            return
        }

        const nameEl = card.querySelector('h1') || card.querySelector('.contact-name') || card.querySelector('p')
        const name = nameEl ? nameEl.textContent.trim() : null
        if (!name) {
            console.warn('renderSelectedUsers: name not found in card', card)
            return
        }

        const elContainer = document.createElement("div")
        elContainer.className = "member-group-container"
        
        const el = document.createElement("div")
        el.className = "member-group"
        
        const avatarUrl = cb.dataset.avatar || '/static/chat_app/images/Avatar-1.png'
        el.innerHTML = `
            <img src="${escapeHTML(avatarUrl)}" alt="${escapeHTML(name)}">
            <h2>${escapeHTML(name)}</h2>
        `

        const removeBtn = document.createElement("button")
        removeBtn.type = "button"
        removeBtn.className = "remove-member"
        
        removeBtn.addEventListener("click", () => {
            cb.checked = false
            
            cb.dispatchEvent(new Event('change', { bubbles: true }))
            
            elContainer.remove()
        })

        elContainer.appendChild(el)
        elContainer.appendChild(removeBtn)
        fragment.appendChild(elContainer)
    })

    container.appendChild(fragment)
}

export function updateSelectedCount() {
    const countEl = document.getElementById("selected-count")
    if (!countEl) return

    const selected = document.querySelectorAll(".group-user-checkbox:checked").length

    countEl.textContent = `Вибрано: ${selected}`
}

document.addEventListener("change", (e) => {
    if (e.target && e.target.classList.contains("group-user-checkbox")) {
        updateSelectedCount()
    }
})
