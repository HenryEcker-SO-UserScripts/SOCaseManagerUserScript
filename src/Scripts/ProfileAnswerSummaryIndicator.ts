import {getSummaryPostActionsFromIds, type SummaryPostActionResponse} from '../AWSAPI';
import {buildCaseSvg, buildCheckmarkSvg, buildEditPenSvg, buildAlertSvg} from '../SVGBuilders';


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
        void getSummaryPostActionsFromIds([...postIdsOnPage])
            .then(postResults => {
                this.render(postIdsOnPage, postResults);
            });
    }

    private render(postsOnPage: Set<number>, annotatedPosts: SummaryPostActionResponse) {
        // Only display indicator for posts that are both on the page and should be annotated
        for (const postId of setIntersection(postsOnPage, new Set(Object.keys(annotatedPosts).map(Number)))) {
            const eventValues = annotatedPosts[postId];
            const symbolBar = $('<div class="case-manager-symbol-group d-flex fd-row g2"></div>');
            eventValues.forEach(e => {
                switch (e) {
                    case 1:
                        symbolBar.append($(`<div title="This post is noted in the Case Manager System as Looks OK" class="flex--item s-post-summary--stats-item" style="color: var(--green-600)">${buildCheckmarkSvg()}</div>`));
                        break;
                    case 2:
                        symbolBar.append($(`<div title="This post is noted in the Case Manager System as edited" class="flex--item s-post-summary--stats-item" style="color: var(--green-800)">${buildEditPenSvg()}</div>`));
                        break;
                    case 3:
                        symbolBar.append($(`<div title="This post is noted in the Case Manager System as plagiarised" class="flex--item s-post-summary--stats-item" style="color: var(--red-600)">${buildCaseSvg()}</div>`));
                        break;
                    case 5:
                        symbolBar.append($(`<div title="This post is noted in the Case Manager System as suspicious" class="flex--item s-post-summary--stats-item" style="color: var(--yellow-700)">${buildAlertSvg()}</div>`));
                        break;
                }
            });
            $(`#answer-id-${postId} .s-post-summary--stats-item:eq(0)`).before(symbolBar);
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