const modalCreatePost = document.querySelector('.modal-container')
const textInput = document.querySelector('#post-text')
const modalTextInput = document.querySelector('.create-post-container textarea')
const closeCross = document.querySelector('.close-cross')

closeCross.addEventListener('click', () => {
    modalCreatePost.style.display = 'none'
})

document.getElementById('create-post').addEventListener('click', () => {
    modalTextInput.value = textInput.value
    modalCreatePost.style.display = 'flex'
})

const tagsInline = document.createElement('p')
tagsInline.className = 'tags-inline'

document.querySelector(".text-area-container").appendChild(tagsInline)

const selectedTags = new Set()

function updateTagsUI() {
    selectedTags.clear()

    document.querySelectorAll("#id_tags input").forEach(input => {
        const label = input.closest("label")

        if (input.checked) {
            label.classList.add("select-label")
            selectedTags.add(label.textContent.trim())
        } else {
            label.classList.remove("select-label")
        }
    })

    renderTags()
}

function renderTags() {
    const output = document.querySelector(".tags-inline")
    if (!output) return

    output.textContent = Array.from(selectedTags)
        .map(tag => `${tag}`)
        .join(" ")
}

document.querySelectorAll("#id_tags input").forEach(input => {
    input.addEventListener("change", updateTagsUI)
})

document.getElementById("id_tags").addEventListener("change", function(event) {
    if (event.target.matches("input[type='checkbox']")) {
        updateTagsUI()
    }
})

document.addEventListener("DOMContentLoaded", updateTagsUI)

function updateLinksUI() {
    const containers = document.querySelectorAll(".container-link")

    const staticAddBtn = document.getElementById("add-link")

    if (containers.length === 0) {
        staticAddBtn.style.display = "inline-flex"
        return
    }

    staticAddBtn.style.display = "none"

    containers.forEach((container, index) => {
        const addBtn = container.querySelector(".add-link")
        const removeBtn = container.querySelector(".remove-link")

        const isLast = index === containers.length - 1

        if (addBtn) {
            addBtn.style.display = isLast ? "inline-flex" : "none"
        }

        if (removeBtn) {
            removeBtn.style.display = isLast ? "inline-flex" : "none"
        }
    })
}

function createLinkInput() {
    const inputContainer = document.createElement("div")
    inputContainer.className = "container-link"

    const linkButtons = document.createElement("div")
    linkButtons.className = "container-link-buttons"

    const addButton = document.createElement("button")
    addButton.className = "add-link"
    addButton.type = "button"

    const removeButton = document.createElement("button")
    removeButton.className = "remove-link"
    removeButton.type = "button"

    const addImage = document.createElement("img")
    addImage.src = "/static/post_app/icons/additional-info.svg"

    const removeImage = document.createElement("img")
    removeImage.src = "/static/post_app/icons/remove-link.svg"

    const input = document.createElement("input")
    input.type = "url"
    input.name = "links"
    input.placeholder = "https://example.com"

    addButton.appendChild(addImage)
    removeButton.appendChild(removeImage)

    linkButtons.appendChild(addButton)
    linkButtons.appendChild(removeButton)

    inputContainer.appendChild(input)
    inputContainer.appendChild(linkButtons)

    document.getElementById("links-list").appendChild(inputContainer)

    addButton.addEventListener("click", createLinkInput)

    removeButton.addEventListener("click", function () {
        inputContainer.remove()
        updateLinksUI()
    })

    updateLinksUI()
}

document.getElementById("add-link").addEventListener("click", createLinkInput)

const fileInput = document.getElementById('file-input') 
const previewContainer = document.getElementById('images-preview')

let selectedFiles = []

fileInput.addEventListener('change', function() {
    const files = this.files

    if (files) {
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                selectedFiles.push(file)

                const reader = new FileReader()

                reader.onload = function(e) {
                    const imgDiv = document.createElement('div')
                    imgDiv.className = "img-container"
                    imgDiv.style.backgroundImage = `url('${e.target.result}')`

                    const buttonRemove = document.createElement('button')
                    buttonRemove.type = "button"
                    buttonRemove.className = "button-remove"

                    const imgRemove = document.createElement('img')
                    imgRemove.src = "/static/post_app/icons/remove-image.svg"

                    buttonRemove.appendChild(imgRemove)
                    imgDiv.appendChild(buttonRemove)
                    previewContainer.appendChild(imgDiv)

                    buttonRemove.addEventListener(
                        'click',
                        function (){
                            const index = selectedFiles.indexOf(file)
                            if (index > -1) {
                                selectedFiles.splice(index, 1)
                                updateFileInput()
                            }
                            imgDiv.remove()
                        }
                    )
            }
            reader.readAsDataURL(file)
        }
    })
}})


function updateFileInput() {
    const dt = new DataTransfer()
    selectedFiles.forEach(file => dt.items.add(file))
    fileInput.files = dt.files
}

document.getElementById("add-tag").addEventListener(
    "click",
    function (){
        document.querySelector('.modal-container div').style.display = "none"
        document.querySelector(".section-add-tag").style.display = "flex"
    }
)

function toCreate(){
    document.querySelector(".section-add-tag").style.display = "none"
    document.querySelector('.create-post-container').style.display = "flex"
    
    document.querySelector(".tag-input p input").textContent = ""
}

document.querySelector(".back-create").addEventListener(
    "click",
    toCreate
)

document.querySelector(".section-add-tag .close-cross-container").addEventListener(
    "click",
    toCreate
)