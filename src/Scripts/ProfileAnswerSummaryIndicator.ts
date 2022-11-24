import {getSummaryPostInfoFromIds} from '../AWSAPI';
import {buildCaseSvg, tabIdentifiers} from '../Globals';


const getAnswerIdsOnPage = (): Set<number> => {
    return new Set($('.s-post-summary').map((i, e) => {
        return Number(e.getAttribute('data-post-id'));
    }).toArray());
};

// const setDifference = <T>(a: Set<T>, b: Set<T>): Set<T> => {
//     return new Set([...a].filter(i => !b.has(i)));
// };

// const mergeSets = <T>(a: Set<T>, b: Set<T>): Set<T> => {
//     return new Set([...a, ...b]);
// };

const setIntersection = <T>(a: Set<T>, b: Set<T>): Set<T> => {
    return new Set([...a].filter(i => b.has(i)));
};


class SummaryAnnotator {
    annotateAnswers() {
        const postIdsOnPage = getAnswerIdsOnPage();
        void getSummaryPostInfoFromIds([...postIdsOnPage])
            .then(postResults => {
                this.render(postIdsOnPage, new Set<number>(postResults));
            });
    }

    private render(postsOnPage: Set<number>, annotatedPosts: Set<number>) {
        // Only display indicator for posts that are both on the page and should be annotated
        for (const postId of setIntersection(postsOnPage, annotatedPosts)) {

            $(`#answer-id-${postId} .s-post-summary--stats-item:eq(0)`)
                .before($(`<div title="This post is noted in the Case Manager System" class="s-post-summary--stats-item" style="color: var(--red-600)">${buildCaseSvg()}</div>`));
        }
    }
}


export const buildAnswerSummaryIndicator = () => {
    const summaryAnnotator = new SummaryAnnotator();
    summaryAnnotator.annotateAnswers();
    // The escape \\ is for the ? that comes with the variable
    const matchPattern = new RegExp(`users/tab/\\d+\\${tabIdentifiers.userAnswers}`, 'gi');
    // Handle buttons on tab/page navigation
    $(document).on('ajaxComplete', (_0, _1, {url}) => {
        if (url.match(matchPattern)) {
            summaryAnnotator.annotateAnswers();
        }
    });
};