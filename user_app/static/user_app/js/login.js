import { getCSRFToken, showErrors } from './utils.js'

document.querySelector('.section-login form')
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
                sessionStorage.setItem(
                    "showProfileModal",
                    !data.is_profile_complete
                )

                window.location.href = '/home/'
            })
            .catch(data => {
                if (data?.errors) {
                    showErrors('login-errors', data.errors)
                }
            })
        })