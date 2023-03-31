import type {ActionEvent} from '@hotwired/stimulus';


export function registerAbsoluteLinkReducer() {
    const absoluteLinkPattern = new RegExp(`\\[(.*?)]\\((?:${window.location.origin})/([^)]+)\\)`, 'g');

    const shortestRelativeLinkReducer = [
        // Convert any absolute links to relative links
        (s: string) => {
            return s.replace(absoluteLinkPattern, '[$1](/$2)');
        },
        // Shorten /questions/postId/title to just /q/postId
        (s: string) => {
            return s.replace(/\[(.*?)]\(\/questions\/(\d+)\/[^/#]+(?:\?.+?)?\)/g, '[$1](/q/$2)');
        },
        // Shorten /questions/questionId/title/answerId#answerId to just /a/answerId
        (s: string) => {
            return s.replace(/\[(.*?)]\(\/questions\/\d+\/.+?#(\d+)(?:\?.+?)?\)/g, '[$1](/a/$2)');
        },
        // Shorten /questions/postId/title#comment[commentId]_[postId] to just /posts/comments/commentId
        (s: string) => {
            return s.replace(/\[(.*?)]\(\/questions\/\d+\/.+?#comment(\d+)_\d+\)/g, '[$1](/posts/comments/$2)');
        },
        // Shorten /users/userid/uname to /users/userid
        (s: string) => {
            return s.replace(/\[(.*?)]\(\/users\/(\d+)\/[^?]+(\?tab=.+?)?\)/g, (sub, p1, p2, p3) => {
                if (p3 === undefined || p3 === '?tab=profile') { // profile tab is default
                    return `[${p1}](/users/${p2})`;
                }
                return `[${p1}](/users/${p2}${p3})`;
            });
        }
    ];

    function patternReducer(reducers: ((s: string) => string)[], text: string, pos: number) {
        return reducers.reduce<[string, number]>((
            [newText, newPos], reducer
        ) => {
            const sLength: number = newText.length;
            // Replace Text
            newText = reducer(newText);
            // Assumes pattern always reduces size (which is the point)
            newPos = Math.max(0, newPos - (sLength - newText.length));
            // Return the string and the updated position
            return [newText, newPos];
        }, [text, pos]);
    }

    Stacks.addController(
        TEXTAREA_SIZE_REDUCER.CONTROLLER,
        {
            target: [TEXTAREA_SIZE_REDUCER.TARGET],
            [TEXTAREA_SIZE_REDUCER.ACTION](ev: ActionEvent) {
                const textarea = <HTMLTextAreaElement>ev.target;
                const [reducedText, selectionStart] = patternReducer(shortestRelativeLinkReducer, textarea.value, textarea.selectionStart);
                textarea.value = reducedText;
                // Fix Cursor Position
                textarea.selectionStart = selectionStart;
                textarea.selectionEnd = selectionStart;
            }
        }
    );
}