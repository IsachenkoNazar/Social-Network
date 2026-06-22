import { getCSRFToken, showErrors } from './utils.js'

const expandForm = document.querySelector('.form-info form')

expandForm.addEventListener('submit', async (event) => {
    event.preventDefault()

    const form = event.target
    const formData = new FormData(form)

    const response = await fetch(form.action, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCSRFToken(),
            "X-Requested-With": "XMLHttpRequest",
        },
        body: formData,
    })
    .then(async response => {
        const data = await response.json()
        if (!response.ok) {
            throw data
        }
        return data
    })
    .then(data => {
        document.querySelector('.form-info-container').style.display = 'none'
    })
    .catch(data => {
        if (data?.errors) {
            showErrors('expand-errors', data.errors)
        }
    })
})