import {html_beautify} from 'js-beautify';

export function cleanWhitespace(htmlStr: string) {
    return html_beautify(htmlStr, {preserve_newlines: false})
        .replace(/>\s*<\s*/gi, '><'); // Collapse all excess space between tags
}
