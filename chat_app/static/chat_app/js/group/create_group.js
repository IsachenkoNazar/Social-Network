import { getCSRFToken } from "/static/user_app/js/utils.js"
import { resetGroupAvatarPreview } from "../ui/group_avatar.js"
import { renderSelectedUsers, updateSelectedCount } from "./selected_users.js"

const nextCreateButton = document.getElementById("next-create")
const cancelCreateButton = document.getElementById("cancel-create")
const backToAddMemberButton = document.getElementById("back-to-add-member")
const addCreateMember = document.getElementById("add-create-member")

let isSubmitting = false

async function submitGroupForm(selected, triggerButton = null) {
    if (isSubmitting) return
    
    const form = document.querySelector("#create-group-form")
    if (!form) {
        console.warn('Form not found')
        return
    }

    isSubmitting = true
    if (triggerButton) triggerButton.disabled = true

    const formData = new FormData(form)
    selected.forEach(cb => {
        if (cb.value) formData.append('users[]', cb.value)
    })

    try {
        const res = await fetch("/chat/create_group/", {
            method: "POST",
            headers: {
                "X-CSRFToken": getCSRFToken()
            },
            body: formData
        })

        const data = await res.json()

        if (!data.success) {
            alert(data.error)
            isSubmitting = false
            if (triggerButton) triggerButton.disabled = false
            return
        }

        if (data.redirect || !data.is_group) {
            window.location.href = '/chat/'
        } else {
            location.reload()
        }
    } catch (error) {
        console.error('Error:', error)
        alert('Помилка при створенні чату')
        
        // Разблокируем при сетевой ошибке
        isSubmitting = false
        if (triggerButton) triggerButton.disabled = false
    }
}

nextCreateButton?.addEventListener("click", function () {
    const selected = document.querySelectorAll(".group-user-checkbox:checked")

    if (selected.length === 0) {
        alert("Виберіть хоча б одного користувача")
        return
    }

    if (selected.length === 1) {
        submitGroupForm(selected, this)
        return
    }

    renderSelectedUsers(selected)

    const createGroup = document.getElementById("create-group")
    if (createGroup) createGroup.style.display = "none"
    if (addCreateMember) addCreateMember.style.display = "flex"
})

function closeGroupModal(element) {
    const group = element.closest(".group")
    const groupContainer = document.querySelector(".group-container")
    if (groupContainer) groupContainer.style.display = "none"
    if (group) group.style.display = "none"
}

cancelCreateButton?.addEventListener("click", function() {
    closeGroupModal(this)
})

document.querySelectorAll(".close-cross-container").forEach(btn => {
    btn.addEventListener("click", function () {
        closeGroupModal(this)
    })
})

backToAddMemberButton?.addEventListener("click", function() {
    const group = this.closest(".group")
    if (group) group.style.display = "none"

    const createGroup = document.getElementById("create-group")
    if (createGroup) createGroup.style.display = "flex"

    const membersList = document.querySelector(".members-list-view")
    if (membersList) membersList.innerHTML = ""

    document.querySelectorAll(".group-user-checkbox:checked").forEach(cb => {
        cb.checked = false
        cb.dispatchEvent(new Event('change', { bubbles: true }))
    })

    updateSelectedCount()
    resetGroupAvatarPreview()
})

addCreateMember
?.querySelector("button[type='submit']")
?.addEventListener("click", async function (e) {
    e.preventDefault()

    const selected = document.querySelectorAll('.group-user-checkbox:checked')

    if (!selected || selected.length === 0) {
        alert('Виберіть хоча б одного користувача')
        return
    }

    submitGroupForm(selected, this)
})
