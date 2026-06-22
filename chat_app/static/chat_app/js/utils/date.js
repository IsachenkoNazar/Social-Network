export function getDateKey(datetime) {
    if (!datetime) return ''
    const date = datetime instanceof Date ? datetime : new Date(datetime)
    
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    
    return `${year}-${month}-${day}`
}

export function formatDateLabel(datetime) {
    if (!datetime) return ''
    const date = datetime instanceof Date ? datetime : new Date(datetime)
    return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })
}