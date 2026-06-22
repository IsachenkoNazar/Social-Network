import { clearNewMessagesUI } from "../ui/message_renderer.js"
import { getCurrentChatId } from "./state.js"
import { sendChatMessage } from "./chat_socket.js"

const ChatForm = document.getElementById("form-chat")
const imageInput = document.getElementById("message-image")
const modalContainer = document.querySelector(".group-container")
const imagePreviewModal = document.getElementById("image-preview-modal")
const sendWithPreviewBtn = document.getElementById("send-with-preview")
const cancelPreviewBtn = document.getElementById("cancel-preview")
const closePreviewBtn = document.querySelector(".image-preview-close")
const previewImagesContainer = document.getElementById("preview-images-container")
const previewMessageText = document.getElementById("preview-message-text")

let currentFiles = []
let isUploading = false

function createImagePreviewItem(file, index) {
    const container = document.createElement("div")
    container.className = "img-preview-item"
    if (!file.previewUrl) {
        file.previewUrl = URL.createObjectURL(file)
    }
    container.style.backgroundImage = `url(${file.previewUrl})`
    container.setAttribute("data-index", index)

    const removeBtn = document.createElement("button")
    removeBtn.type = "button"
    removeBtn.className = "img-preview-remove-btn"
    
    removeBtn.addEventListener("click", (e) => {
        e.preventDefault()
        e.stopPropagation()
        removeImagePreview(index)
    })

    container.appendChild(removeBtn)
    return container
}

function removeImagePreview(indexToRemove) {
    // Remove file from array
    currentFiles.splice(indexToRemove, 1)
    
    // Re-render preview
    renderPreviewImages()
    
    // Close modal if no images left
    if (currentFiles.length === 0) {
        closePreviewModal()
    }
}

function renderPreviewImages() {
    previewImagesContainer.innerHTML = ""
    currentFiles.forEach((file, index) => {
        const previewItem = createImagePreviewItem(file, index)
        previewImagesContainer.appendChild(previewItem)
    })
}

imageInput?.addEventListener("change", function(event) {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Validate all files are images
    const validFiles = []
    for (let file of files) {
        if (!file.type.startsWith('image/')) {
            alert('Будь ласка, оберіть файли зображення')
            imageInput.value = ""
            return
        }
        validFiles.push(file)
    }

    for (const file of validFiles) {
        const exists = currentFiles.some(
            f =>
                f.name === file.name &&
                f.size === file.size &&
                f.lastModified === file.lastModified
        )

        if (!exists) {
            currentFiles.push(file)
        }
    }

    renderPreviewImages()

    modalContainer.style.display = "flex"
    imagePreviewModal.style.display = "flex"
    previewMessageText.focus()

    imageInput.value = ""
})

function closePreviewModal() {
    if (imagePreviewModal) {
        imagePreviewModal.style.display = "none"
        modalContainer.style.display = "none"
    }

    // Clean up blob URLs
    currentFiles.forEach(file => {
        if (file.previewUrl) {
            URL.revokeObjectURL(file.previewUrl)
            delete file.previewUrl
        }
    })

    currentFiles = []
    previewImagesContainer.innerHTML = ""
    previewMessageText.value = ""

    if (imageInput) {
        imageInput.value = ""
    }
    
    if (sendWithPreviewBtn) {
        sendWithPreviewBtn.disabled = false
        sendWithPreviewBtn.textContent = "Відправити"
    }
    isUploading = false
}

closePreviewBtn?.addEventListener("click", closePreviewModal)
cancelPreviewBtn?.addEventListener("click", closePreviewModal)

imagePreviewModal?.addEventListener("click", (e) => {
    if (e.target === imagePreviewModal) {
        closePreviewModal()
    }
})

sendWithPreviewBtn?.addEventListener("click", async function(e) {
    e.preventDefault()
    e.stopPropagation()

    if (!currentFiles || currentFiles.length === 0 || isUploading) return

    const chatId = getCurrentChatId()
    if (!chatId || String(chatId) === "null") {
        alert("Помилка: не вдалося визначити ID чату")
        return
    }

    isUploading = true
    this.disabled = true
    this.textContent = "Завантаження..."

    try {
        const messageText = (previewMessageText.value || "").trim()
        const formData = new FormData()
        currentFiles.forEach(file => {
            formData.append("image", file)
        })
        formData.append("message", messageText || "")
        formData.append("csrfmiddlewaretoken", ChatForm.querySelector('[name="csrfmiddlewaretoken"]')?.value || "")

        const response = await fetch(`/chat/message_upload/${String(chatId)}/`, {
            method: "POST",
            headers: {
                "X-CSRFToken": formData.get("csrfmiddlewaretoken"),
                "X-Requested-With": "XMLHttpRequest"
            },
            body: formData,
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
            alert(`Помилка сервера: ${data.error || 'Невідома помилка'}`)
            isUploading = false
            this.disabled = false
            this.textContent = "Відправити"
            return
        }

        closePreviewModal()
        ChatForm?.reset()
        
    } catch (error) {
        console.error('Image upload failed:', error)
        alert('Не вдалося надіслати зображення. Перевірте з\'єднання.')
        isUploading = false
        this.disabled = false
        this.textContent = "Відправити"
    }
})

ChatForm?.addEventListener("submit", function(event) {
    event.preventDefault() 

    if (imageInput?.files?.[0]) {
        return
    }

    clearNewMessagesUI()

    const formData = new FormData(ChatForm)
    const messageText = (formData.get('message') || '').trim()

    if (!messageText) return

    const fromObject = Object.fromEntries(formData)
    sendChatMessage(fromObject)
    
    ChatForm.reset()
})

ChatForm?.querySelector('textarea, input[name="message"]')?.addEventListener("keydown", function(e) {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault() 
        if (ChatForm) {
            ChatForm.requestSubmit() 
        }
    }
})
