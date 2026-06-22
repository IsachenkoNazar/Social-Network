const editButton = document.getElementById("editButton")
const saveButton = document.getElementById("saveButton")
const modalWindow = document.getElementById("modalWindow")
const profilePanel = document.getElementById("profilePanel")
const editProfileButton = document.getElementById("editProfileButton")
const saveProfileButton = document.getElementById("saveProfileButton")
const infoModal= document.getElementById("infoModal")
const personalInfo = document.getElementById("settingInfo")
const editPassword = document.getElementById("editPasswordButton")
const savePassword = document.getElementById("savePasswordButton")
const passwordModal = document.getElementById("passwordModal")



editButton.addEventListener("click", () => {
    modalWindow.style.display = "flex"
    profilePanel.style.display = "none"
})

saveButton.addEventListener("click", () => {
    infoModal.style.display = "none"
    profilePanel.style.display = "flex"
})

editProfileButton.addEventListener("click", () => {
    infoModal.style.display = "flex"
    personalInfo.style.display = "none"
})

saveProfileButton.addEventListener("click", () => {
    settingInfo.style.display = "none"
    settingInfo.style.display = "flex"
})



