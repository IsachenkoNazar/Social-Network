import { getCSRFToken } from "/static/user_app/js/utils.js"
import { escapeHTML } from "../utils/clear_html.js"
import { getCurrentChatId, getCurrentChatIsGroup, setCurrentChatTotalMembers } from "../chat/state.js"
import { updateChatStatus } from "../chat/chat_open.js"
import { updateChatListItemMetadata } from "../ui/chat_list.js"

const confirmationModal = document.getElementById("confirmation-modal")
const confirmationTitle = document.getElementById("confirmation-title")
const confirmationMessage = document.getElementById("confirmation-message")
const confirmationConfirmBtn = document.getElementById("confirmation-confirm-btn")
const confirmationCancelBtn = document.getElementById("confirmation-cancel-btn")

let currentConfirmAction = null

const editButton = document.getElementById("edit-group-btn")
const editModal = document.getElementById("edit-group-modal")
const editForm = document.getElementById("edit-group-form")
const editGroupNameInput = document.getElementById("edit-group-name")
const editGroupAvatarInput = editModal?.querySelector('.group-avatar-input')
const editGroupAvatarPreview = editModal?.querySelector('.group-avatar-preview')
const cancelEditButton = document.getElementById("cancel-edit-group")
const editParticipantModal = document.getElementById("edit-participant-modal")

let currentChatMembers = []

function getCurrentMemberIds() {
  return new Set(currentChatMembers.map(m => String(m.id)))
}

function getCurrentHeaderAvatarSrc() {
  return document.getElementById('group-header-avatar')?.src || editGroupAvatarPreview?.dataset.defaultSrc || ''
}

function openConfirmationModal(title, message, onConfirm) {
  if (!confirmationModal || !confirmationTitle || !confirmationMessage) return
  
  confirmationTitle.textContent = title
  confirmationMessage.textContent = message
  currentConfirmAction = onConfirm
  
  confirmationModal.style.display = 'flex'
}

function closeConfirmationModal() {
  if (!confirmationModal) return
  confirmationModal.style.display = 'none'
  currentConfirmAction = null
}

function openEditModal() {
  if (!editModal) return
  const titleText = document.getElementById('chat-title')?.textContent || ''
  if (editGroupNameInput) editGroupNameInput.value = titleText
  if (editGroupAvatarPreview) editGroupAvatarPreview.src = getCurrentHeaderAvatarSrc()
  renderGroupMembers(currentChatMembers)

  const groupContainer = document.querySelector('.group-container')
  if (groupContainer) groupContainer.style.display = 'flex'
  editModal.style.display = 'flex'
}

function closeEditModal() {
  if (!editModal) return
  editModal.style.display = 'none'
  const groupContainer = document.querySelector('.group-container')
  if (groupContainer) groupContainer.style.display = 'none'
  if (editGroupAvatarInput) {
    editGroupAvatarInput.value = ''
  }
}

async function openAddParticipantModal() {
  if (editModal) editModal.style.display = 'none'
  const groupContainer = document.querySelector('.group-container')
  if (groupContainer) groupContainer.style.display = 'flex'
  if (editParticipantModal) editParticipantModal.style.display = 'flex'

  const memberIds = getCurrentMemberIds()
  window.currentGroupMemberIds = memberIds

  if (typeof window.ensureContactsLoaded === 'function') {
    await window.ensureContactsLoaded()
  }

  prepareAddParticipantModal()
}

function prepareAddParticipantModal() {
  const memberIds = window.currentGroupMemberIds || getCurrentMemberIds()
  const checkboxes = editParticipantModal?.querySelectorAll('.group-user-checkbox')
  
  if (!checkboxes) return
  
  checkboxes.forEach(checkbox => {
    const userId = String(checkbox.value)
    checkbox.checked = false
    checkbox.disabled = memberIds.has(userId)
    const card = checkbox.closest('.card-member, .people-contact-modal, .people-contact-plain')
    if (card) {
      card.classList.toggle('disabled-contact', memberIds.has(userId))
    }
  })
}


function closeAddParticipantModal() {
  if (!editParticipantModal) return
  editParticipantModal.style.display = 'none'
  if (editModal) editModal.style.display = 'flex'
  const groupContainer = document.querySelector('.group-container')
  if (groupContainer && !editModal) groupContainer.style.display = 'none'
}

async function sendChatAction(chatId, action, formData = null) {
  const url = `/chat/chat_action/${chatId}/`
  const body = formData || new FormData()
  body.append('action', action)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-CSRFToken': getCSRFToken(),
      'X-Requested-With': 'XMLHttpRequest'
    },
    body,
  })

  return response.json()
}

const actionMenu = document.getElementById('chat-action-menu')
const actionError = document.getElementById('chat-action-error')

function showActionMenu() {
  if (!actionMenu) return
  actionMenu.classList.add('open')
  actionMenu.setAttribute('aria-hidden', 'false')
}

function hideActionMenu() {
  if (!actionMenu) return
  actionMenu.classList.remove('open')
  actionMenu.setAttribute('aria-hidden', 'true')
  if (actionError) {
    actionError.textContent = ''
    actionError.classList.remove('visible')
  }
}

function showActionError(message) {
  if (!actionError) return
  actionError.textContent = message
  actionError.classList.add('visible')
}

function renderGroupMembers(members = []) {
  const container = editModal?.querySelector('.members-list-view') || document.querySelector('.members-list-view')
  if (!container) return

  container.innerHTML = ''

  if (!members || members.length === 0) {
    const emptyText = document.createElement('p')
    emptyText.textContent = 'Учасників не знайдено'
    emptyText.style.color = '#6b7280'
    container.appendChild(emptyText)
    return
  }

  members.forEach(member => {
    const memberContainer = document.createElement('div')
    memberContainer.className = 'member-group-container'

    const memberInfo = document.createElement('div')
    memberInfo.className = 'member-group'

    const avatarUrl = member.avatar || '/static/chat_app/images/Avatar-1.png'
    memberInfo.innerHTML = `
      <img src="${escapeHTML(avatarUrl)}" alt="${escapeHTML(member.username)}">
      <h2>${escapeHTML(member.username)}</h2>
    `

    memberContainer.appendChild(memberInfo)

    if (member.is_admin) {
      const badge = document.createElement('span')
      badge.className = 'member-badge'
      badge.textContent = 'Адмін'
      memberContainer.appendChild(badge)
    } else {
      const removeButton = document.createElement('button')
      removeButton.type = 'button'
      removeButton.className = 'remove-member'
      removeButton.dataset.userId = String(member.id)
      removeButton.title = 'Видалити з групи'
      memberContainer.appendChild(removeButton)
    }

    container.appendChild(memberContainer)
  })
}

async function handleRemoveGroupMember(userId) {
  const chatId = getCurrentChatId()
  if (!chatId) return
  if (!userId) return

  openConfirmationModal(
    'Видалення з групи',
    'Ви впевнені, що хочете видалити цього користувача з групи?',
    async () => {
      closeConfirmationModal()
      
      const formData = new FormData()
      formData.append('user_id', userId)

      const result = await sendChatAction(chatId, 'remove_participant', formData)
      if (!result.success) {
        alert(result.error || 'Не вдалося видалити користувача')
        return
      }

      currentChatMembers = currentChatMembers.filter(member => String(member.id) !== String(userId))
      renderGroupMembers(currentChatMembers)
      window.setCurrentChatMembers?.(currentChatMembers)
      setCurrentChatTotalMembers(currentChatMembers.length)
      updateChatStatus(null, true)
    }
  )
}

function setCurrentChatMembers(members = []) {
  currentChatMembers = Array.isArray(members) ? members : []
  window.currentChatMembers = currentChatMembers
  setCurrentChatTotalMembers(currentChatMembers.length)
  renderGroupMembers(currentChatMembers)
  if (getCurrentChatIsGroup()) {
    updateChatStatus(null, true)
  }
}

window.setCurrentChatMembers = setCurrentChatMembers
window.currentChatMembers = currentChatMembers

function updateActionMenu() {
  const isGroup = getCurrentChatIsGroup()
  const isAdmin = Boolean(window.currentChatIsAdmin)
  const editItem = document.querySelector('.chat-action-item[data-action="edit_group"]')
  const leaveItem = document.querySelector('.chat-action-item[data-action="leave_group"]')
  const deleteItem = document.querySelector('.chat-action-item[data-action="delete_chat"]')

  if (editItem) editItem.style.display = isGroup && isAdmin ? 'block' : 'none'
  if (leaveItem) leaveItem.style.display = isGroup && !isAdmin ? 'block' : 'none'
  if (deleteItem) deleteItem.style.display = !isGroup ? 'block' : 'none'
}

async function handleLeaveGroup(chatId) {
  openConfirmationModal(
    'Вихід з групи',
    'Ви впевнені, що хочете вийти з групи?',
    async () => {
      closeConfirmationModal()
      
      const result = await sendChatAction(chatId, 'leave_group')
      if (!result.success) {
        showActionError(result.error || 'Не вдалося вийти з групи')
        return
      }
      window.location.href = '/chat/'
    }
  )
}

async function handleDeleteChat(chatId) {
  openConfirmationModal(
    'Видалення чату',
    'Ви впевнені, що хочете видалити цей чат?',
    async () => {
      closeConfirmationModal()
      
      const result = await sendChatAction(chatId, 'delete_chat')
      if (!result.success) {
        showActionError(result.error || 'Не вдалося видалити чат')
        return
      }
      window.location.href = '/chat/'
    }
  )
}

async function handleEditGroupSubmit(event) {
  event.preventDefault()
  const chatId = getCurrentChatId()
  if (!chatId || !editForm) return

  const formData = new FormData(editForm)
  const result = await sendChatAction(chatId, 'edit_group', formData)

  if (!result.success) {
    alert(result.error || 'Не вдалось зберегти зміни')
    return
  }

  if (result.name && document.getElementById('chat-title')) {
    document.getElementById('chat-title').textContent = result.name
  }
  if (result.avatar && document.getElementById('group-header-avatar')) {
    document.getElementById('group-header-avatar').src = result.avatar
  }

  updateChatListItemMetadata(chatId, {
    name: result.name,
    avatar: result.avatar
  })

  closeEditModal()
}

async function handleAddParticipantsSubmit() {
  const chatId = getCurrentChatId()
  if (!chatId) {
    alert('Помилка: чат не знайдений')
    return
  }

  const selected = editParticipantModal?.querySelectorAll('.group-user-checkbox:checked:not(:disabled)') || []
  if (selected.length === 0) {
    alert('Виберіть хоча б одного користувача')
    return
  }

  const formData = new FormData()
  formData.append('action', 'add_participants')
  selected.forEach(checkbox => {
    formData.append('users[]', checkbox.value)
  })

  const result = await sendChatAction(chatId, 'add_participants', formData)

  if (!result.success) {
    alert(result.error || 'Не вдалось додати користувачів')
    return
  }

  if (result.added_users) {
    currentChatMembers.push(...result.added_users)
    renderGroupMembers(currentChatMembers)
    window.setCurrentChatMembers?.(currentChatMembers)
    setCurrentChatTotalMembers(currentChatMembers.length)
    updateChatStatus(null, true)
  }

  closeAddParticipantModal()
  openEditModal()
}

if (editGroupAvatarInput && editGroupAvatarPreview) {
  editGroupAvatarInput.addEventListener('change', function () {
    const file = this.files?.[0]
    if (!file) return
    const previewUrl = URL.createObjectURL(file)
    editGroupAvatarPreview.src = previewUrl
  })
}

cancelEditButton?.addEventListener('click', function () {
  closeEditModal()
})

editForm?.addEventListener('submit', handleEditGroupSubmit)

window.addEventListener('click', function (event) {
  if (event.target.closest('#open-add-participant')) {
    openAddParticipantModal()
  }

  if (event.target.closest('#cancel-add-participant')) {
    event.preventDefault()
    closeAddParticipantModal()
  }

  if (event.target.closest('#save-add-participant')) {
    event.preventDefault()
    handleAddParticipantsSubmit()
  }

  const removeButton = event.target.closest('.remove-member')
  if (removeButton) {
    const userId = removeButton.dataset.userId
    handleRemoveGroupMember(userId)
  }
})

editButton?.addEventListener('click', function (event) {
  event.stopPropagation()
  updateActionMenu()
  showActionMenu()
})

actionMenu?.addEventListener('click', async function (event) {
  const item = event.target.closest('.chat-action-item')
  if (!item) return
  const chatId = getCurrentChatId()
  if (!chatId) return

  const action = item.dataset.action
  if (action === 'edit_group') {
    openEditModal()
    hideActionMenu()
    return
  }

  if (action === 'leave_group') {
    await handleLeaveGroup(chatId)
    return
  }

  if (action === 'delete_chat') {
    await handleDeleteChat(chatId)
    return
  }
})

document.addEventListener('click', function (event) {
  if (!actionMenu || !editButton) return
  if (actionMenu.contains(event.target) || editButton.contains(event.target)) return
  hideActionMenu()
})

window.addEventListener('scroll', function () {
  hideActionMenu()
})

// Confirmation Modal Event Listeners
confirmationConfirmBtn?.addEventListener('click', async function () {
  if (currentConfirmAction && typeof currentConfirmAction === 'function') {
    await currentConfirmAction()
  }
})

confirmationCancelBtn?.addEventListener('click', function () {
  closeConfirmationModal()
})

// Close modal when clicking outside of it
confirmationModal?.addEventListener('click', function (event) {
  if (event.target === confirmationModal) {
    closeConfirmationModal()
  }
})

// Close modal on Escape key
document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape' && confirmationModal?.style.display === 'flex') {
    closeConfirmationModal()
  }
})

window.updateChatActionMenu = updateActionMenu
