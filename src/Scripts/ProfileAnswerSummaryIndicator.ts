import {getSummaryPostInfoFromIds} from '../AWSAPI';
import {buildCaseSvg, userAnswerTabProfile} from '../Globals';


const getAnswerIdsOnPage = (): Set<number> => {
    return new Set($('.s-post-summary').map((i, e) => {
        return Number(e.getAttribute('data-post-id'));
    }).toArray());
};

const setDifference = <T>(a: Set<T>, b: Set<T>): Set<T> => {
    return new Set([...a].filter(i => !b.has(i)));
};
const setIntersection = <T>(a: Set<T>, b: Set<T>): Set<T> => {
    return new Set([...a].filter(i => b.has(i)));
};

const mergeSets = <T>(a: Set<T>, b: Set<T>): Set<T> => {
    return new Set([...a, ...b]);
};


class SummaryAnnotator {
    private checkedPostIds: Set<number>;
    private annotatedPosts: Set<number>;

    constructor() {
        this.checkedPostIds = new Set();
        this.annotatedPosts = new Set();
    }

    updateSets() {
        const postIdsOnPage = getAnswerIdsOnPage();
        const uncheckedIds = [...setDifference(postIdsOnPage, this.checkedPostIds)];
        if (uncheckedIds.length === 0) {
            this.render(postIdsOnPage);
            return; // don't fetch more if we've already seen all the IDs on the page
        }
        void getSummaryPostInfoFromIds(
            // Only search for ids on the page that we haven't already checked
            uncheckedIds
        ).then(postResults => {
            this.annotatedPosts = mergeSets(this.annotatedPosts, postResults);
            this.checkedPostIds = mergeSets(this.checkedPostIds, postIdsOnPage);

            this.render(postIdsOnPage);
        });
    }

    private render(postsOnPage: Set<number>) {
        // Only display indicator for posts that are both on the page and should be annotated
        for (const postId of setIntersection(postsOnPage, this.annotatedPosts)) {

            $(`#answer-id-${postId} .s-post-summary--stats-item:eq(0)`)
                .before($(`<div title="This post is noted in the Case Manager System" class="s-post-summary--stats-item" style="color: var(--red-600)">${buildCaseSvg()}</div>`));
        }
    }
}


export const buildAnswerSummaryIndicator = () => {
    const summaryAnnotator = new SummaryAnnotator();
    summaryAnnotator.updateSets();
    // The escape \\ is for the ? that comes with the variable
    const matchPattern = new RegExp(`users/tab/\\d+\\${userAnswerTabProfile}`, 'gi');
    // Handle buttons on tab/page navigation
    $(document).on('ajaxComplete', (_0, _1, {url}) => {
        if (url.match(matchPattern)) {
            summaryAnnotator.updateSets();
        }
    });
};