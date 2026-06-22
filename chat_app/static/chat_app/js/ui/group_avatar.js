const DEFAULT_GROUP_AVATAR = '/static/chat_app/icons/people.svg'
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // Лимит 5 МБ для защиты от зависаний

function getVisibleAvatarInput() {
    return document.querySelector('.group-avatar-input:not([hidden])') || document.querySelector('.group-avatar-input')
}

function getVisibleAvatarPreview() {
    return document.querySelector('.group-avatar-preview')
}

export function resetGroupAvatarPreview() {
    const avatarPreview = getVisibleAvatarPreview()
    const avatarInput = getVisibleAvatarInput()
    if (!avatarPreview) return

    if (avatarPreview.src.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview.src)
    }

    avatarPreview.src = avatarPreview.dataset.defaultSrc || DEFAULT_GROUP_AVATAR
    avatarPreview.classList.remove('group-avatar-preview--custom')

    if (avatarInput) {
        avatarInput.value = ''
    }
}

function handleAvatarChange(input) {
    const avatarPreview = getVisibleAvatarPreview()
    if (!avatarPreview) return

    const file = input.files?.[0]

    if (!file) {
        resetGroupAvatarPreview()
        return
    }

    if (!file.type.startsWith('image/')) {
        alert('Оберіть файл зображення')
        resetGroupAvatarPreview()
        return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
        alert('Файл занадто великий. Максимальний розмір: 5 МБ')
        resetGroupAvatarPreview()
        return
    }

    if (avatarPreview.src.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview.src)
    }

    avatarPreview.src = URL.createObjectURL(file)
    avatarPreview.classList.add('group-avatar-preview--custom')
}

document.addEventListener('change', (event) => {
    const input = event.target
    if (!(input instanceof HTMLInputElement)) return
    if (!input.classList.contains('group-avatar-input')) return

    handleAvatarChange(input)
})

export function getDefaultGroupAvatar() {
    const preview = getVisibleAvatarPreview()
    return preview?.dataset.defaultSrc || DEFAULT_GROUP_AVATAR
}
