const CACHE_KEY = "chat_contacts_cache_v1"
const CACHE_TTL_MS = 5 * 60 * 1000

export function saveCache(data) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            ts: Date.now(),
            data
        }))
    } catch (error) {
        console.warn('Failed to save chat contacts cache to localStorage:', error)
    }
}

export function loadCache() {
    try {
        const raw = localStorage.getItem(CACHE_KEY)
        if (!raw) return null

        const parsed = JSON.parse(raw)

        if (!parsed || !parsed.ts || Date.now() - parsed.ts > CACHE_TTL_MS) {
            localStorage.removeItem(CACHE_KEY)
            return null
        }

        return parsed.data
    } catch (error) {
        console.error('Failed to load or parse chat contacts cache:', error)
        return null
    }
}