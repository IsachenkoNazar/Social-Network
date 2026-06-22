import { getCSRFToken, showErrors } from './utils.js'
import {
    showRegisterForm,
    showLoginForm,
    showConfirmForm,
    hideConfirmForm,
} from './ui/authViews.js'

import { initCodeInputs } from './ui/codeInputs.js'

document.querySelector(".side-panel-container").style.display = "none" 

export function initAuth() {
    const codeInputs = initCodeInputs()

    document.getElementById('register')
        ?.addEventListener('click', showRegisterForm)

    document.getElementById('login')
        ?.addEventListener('click', showLoginForm)

    document.querySelector('.button-register')
        ?.addEventListener('click', showConfirmForm)

    document.querySelector('.back')
        ?.addEventListener('click', () => {
            hideConfirmForm()
            showRegisterForm()
            codeInputs.clear()
        })
}

initAuth()