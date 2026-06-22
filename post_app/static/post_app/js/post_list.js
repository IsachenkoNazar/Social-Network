let currentPage = 1
let isLoading = false

const loaderLine = document.getElementById('postLoaderLine')
const postList = document.querySelector('.post-list')

if (loaderLine && postList) {
    const currentPath = window.location.pathname
    const postsUrl = currentPath.endsWith('/') ? currentPath : `${currentPath}/`

    const observer = new IntersectionObserver(async (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
            isLoading = true
            currentPage++
            const response = await fetch(`${postsUrl}?page=${currentPage}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            const data = await response.json()
            if (data.success) {
                loaderLine.insertAdjacentHTML('beforebegin', data.html)
            } else {
                observer.disconnect()
            }
            isLoading = false
        }
    }, {rootMargin: '200px'})

    observer.observe(loaderLine)
}