document.querySelector(".alboms").addEventListener("click", function() {
    document.querySelector(".settings-container").style.display = "none"
    document.querySelector(".alboms-container").style.display = "flex"
    const element = document.querySelector(".alboms")
    element.style.borderBottom = '2px solid black'
    document.querySelector(".personal-information").style.color = '#81818D'
})