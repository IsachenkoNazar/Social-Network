export function showRegisterForm(){
    document.querySelector('.section-register').style.display = 'flex'
    document.querySelector('.section-login').style.display = 'none'
}

export function showLoginForm(){
    document.querySelector('.section-register').style.display = 'none'
    document.querySelector('.section-login').style.display = 'flex'
}

export function showConfirmForm() {
    document.querySelector('.section-register').style.display = 'none'
    document.querySelector('.section-confirm').style.display = 'flex'
}

export function hideConfirmForm() {
    document.querySelector('.section-confirm').style.display = 'none'
    document.querySelector('.section-register').style.display = 'flex'
}