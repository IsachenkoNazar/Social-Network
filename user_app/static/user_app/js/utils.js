export function getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content')
}

export function showErrors(containerId, errors) {
    const errorsContainer = document.getElementById(containerId)
    if (!errorsContainer) return

    errorsContainer.innerHTML = ""

    for (let fieldName in errors) {
        errors[fieldName].forEach(errorObj => {
            let p = document.createElement('p')
            p.textContent = errorObj.message
            errorsContainer.appendChild(p)
        })
    }
}