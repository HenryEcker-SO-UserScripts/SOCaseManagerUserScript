export function cleanWhitespace(s: string) {
    return s
        .replace(/\s{2,}/gi, ' ')
        .replace(/\s*<\s*/gi, '<')
        .replace(/\s*>\s*/gi, '>');
}
