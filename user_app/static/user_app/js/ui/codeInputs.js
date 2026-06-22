export function initCodeInputs(selector = '.code-input') {
    const inputs = document.querySelectorAll(selector)

    if (!inputs.length) return

    inputs.forEach((input, index) => {

        input.addEventListener('input', (event) => {
            if (event.target.value.length === 1 && index < inputs.length - 1) {
                inputs[index + 1].focus()
            }
        })

        input.addEventListener('keydown', (event) => {
            if (event.key === 'Backspace' && !event.target.value && index > 0) {
                inputs[index - 1].focus()
            }
        })
    })

    return {
        clear() {
            inputs.forEach(i => i.value = '')
        }
    }
}