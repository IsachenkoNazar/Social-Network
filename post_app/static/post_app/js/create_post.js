import { getCSRFToken, showErrors } from '/static/user_app/js/utils.js'

document.getElementById("post-create-form").addEventListener("submit", function (event) {
    event.preventDefault()

    const form = event.target
    const formData = new FormData(form)

    fetch(form.action, {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken(),
            "X-Requested-With": "XMLHttpRequest",
        },
        body: formData,
    })
    .then(async (response) => {
        const data = await response.json()
        console.log(data)

        if (!response.ok) {
            throw data
        }

        return data
    })
    .then((data) => {
        if (data.redirect_url) {
            window.location.href = data.redirect_url
        }
    })
    .catch((data) => {
        if (data.errors) {
            console.log(data.errors)
            showErrors(data.errors)
        }
    })
})

document.getElementById("add-tag-form").addEventListener("submit", function (event) {
    event.preventDefault()

    const form = event.target
    const formData = new FormData(form)

    fetch(form.action, {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken(),
            "X-Requested-With": "XMLHttpRequest",
        },
        body: formData,
    })
    .then(async (response) => {
        const data = await response.json()
        console.log(data)

        if (!response.ok) {
            throw data
        }

        return data
    })
    .then((data) => {
        document.querySelector(".section-add-tag").style.display = "none"
        document.querySelector('.create-post-container').style.display = "flex"

        document
        .getElementById("add-tag")
        .insertAdjacentHTML("beforebegin", data.tag.html)

        updateTagsUI()
    })
    .catch((data) => {
        if (data.errors) {
            console.log(data.errors)
            showErrors(data.errors)
        }
    })
})