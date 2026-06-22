import { getCSRFToken } from "/static/user_app/js/utils.js"

const urlLinks = document.querySelectorAll('.url')

for (let link of urlLinks) {
    if (link.href === window.location.href) {
        link.style.backgroundColor = '#E9E5EE'
        link.style.cursor = 'default'
        link.style.borderRadius = "3px"
        link.style.padding = "4px 8px 4px 8px"
        link.addEventListener('click', function(event) {
            event.preventDefault()
        })
    }
}

const needModal = sessionStorage.getItem("showProfileModal")
const modal = document.querySelector('.form-info-container')

if (needModal == "true") {
    
    const message = document.createElement('p')

    message.className = 'modal-message'
    message.innerHTML = `<span>Або оберіть:</span><span class="text-accent">Запропоновані варіанти відповідно до Ім’я та Прізвища</span>`
    

    document.querySelector('.form').appendChild(message)

    modal.style.display = 'flex'

    sessionStorage.removeItem("showProfileModal")
}
else{
    // modal.remove()
}