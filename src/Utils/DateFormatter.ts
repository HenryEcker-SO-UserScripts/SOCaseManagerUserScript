const stackExchangeDateTimeFormat = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    hour12: false
});

export function toStackExchangeDateFormat(dateString: string): string {
    const parts = stackExchangeDateTimeFormat.formatToParts(new Date(dateString));
    parts[5].value = ' at '; // Literal separator between Date and Time
    return parts.map(v => v.value).join('');
}