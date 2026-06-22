import { getCSRFToken, showErrors } from './utils.js'
import { showLoginForm, hideConfirmForm } from './ui/authViews.js'
import { initCodeInputs } from './ui/codeInputs.js'

const codeInputs = initCodeInputs()

document.querySelector('.section-confirm form')
        ?.addEventListener('submit', function (event) {
            event.preventDefault()

            const form = event.target
            const formData = new FormData(form)

            fetch(form.action, {
                method: "POST",
                headers: {
                    "X-CSRFToken": getCSRFToken(),
                    "X-Requested-With": "XMLHttpRequest",
                },
                body: formData
            })
            .then(async response => {
                const data = await response.json()
                if (!response.ok) {
                    throw data
                }
                return data
            })
            .then(data => {
                hideConfirmForm()
                showLoginForm()
                codeInputs?.clear()
            })
            .catch(data => {
                if (data?.errors) {
                    showErrors('confirm-errors', data.errors)
                }
            })
        })
