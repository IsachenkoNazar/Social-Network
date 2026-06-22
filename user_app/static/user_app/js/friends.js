const home = document.getElementById('friends-home')
const section = document.getElementById('friends-section')

const sectionList = document.getElementById('friends-section-list')

const backBtn = document.getElementById('friends-back-home')
const backBtnNav = document.getElementById('friends-back-home-nav')

let currentSectionKey = null
let currentPage = 1
let isLoading = false
let hasNext = true

let observer = null

function updateNavSelection(selectedKey = null) {
    document
        .querySelectorAll('.friends-panel [data-section-link]')
        .forEach(btn => {
            btn.classList.toggle(
                'selected',
                btn.dataset.sectionLink === selectedKey
            )
        })

    if (backBtnNav) {
        backBtnNav.classList.toggle(
            'selected',
            selectedKey === null
        )
    }
}

function showHome() {
    if (home) home.style.display = 'flex'
    if (section) section.style.display = 'none'

    updateNavSelection()

    if (observer) {
        observer.disconnect()
    }
}

function showSection(title, html) {
    if (home) home.style.display = 'none'
    if (section) section.style.display = 'flex'

    const titleElement = document.getElementById('section-title')

    if (titleElement) {
        titleElement.textContent = title
    }

    if (sectionList) {
        sectionList.innerHTML = `
            ${html}
            <div id="section-loader-line"></div>
        `
    }

    initObserver()
}

async function loadSection(key, page = 1, append = false) {

    if (isLoading || !hasNext) return

    isLoading = true

    try {
        const response = await fetch(
            `/friends/section/${key}/?page=${page}`,
            {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            }
        )

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()

        hasNext = data.has_next

        if (!append) {

            currentPage = 1

            showSection(data.title, data.html)

        } else {

            const loader = document.getElementById('section-loader-line')

            if (loader) {
                loader.insertAdjacentHTML(
                    'beforebegin',
                    data.html
                )
            }

            currentPage = page
        }

        if (!hasNext && observer) {
            observer.disconnect()
        }

    } catch (err) {

        console.error('Pagination error:', err)

    } finally {

        isLoading = false
    }
}

function initObserver() {

    const loader = document.getElementById('section-loader-line')

    if (!loader) return

    if (observer) {
        observer.disconnect()
    }

    observer = new IntersectionObserver(async ([entry]) => {

        if (!entry.isIntersecting) return

        await loadSection(
            currentSectionKey,
            currentPage + 1,
            true
        )

    }, {
        rootMargin: '200px'
    })

    observer.observe(loader)
}

document.addEventListener('click', (e) => {

    const btn = e.target.closest('[data-section-link]')

    if (!btn) return

    const key = btn.dataset.sectionLink

    currentSectionKey = key
    currentPage = 1
    hasNext = true

    updateNavSelection(key)

    loadSection(key)

})

if (backBtn) {
    backBtn.addEventListener('click', showHome)
}

if (backBtnNav) {
    backBtnNav.addEventListener('click', showHome)
}

showHome()