import {Feedback, getSummaryPostActionsFromIds, type SummaryPostActionResponse} from '../AWSAPI';
import {buildAlertSvg, buildCaseSvg, buildCheckmarkSvg, buildEditPenSvg} from '../SVGBuilders';


const getAnswerIdsOnPage = (): Set<string> => {
    return new Set($('.s-post-summary').map((i, e) => {
        return e.getAttribute('data-post-id');
    }).toArray());
};

class SummaryAnnotator {
    private static iconAttrMap: {
        [id: number]: {
            desc: string;
            colourVar: string;
            svg: string;
        };
    } = {
        [Feedback.LooksOK]: {desc: 'Looks OK', colourVar: '--green-600', svg: buildCheckmarkSvg(16)},
        [Feedback.Edited]: {desc: 'edited', colourVar: '--green-800', svg: buildEditPenSvg(16)},
        [Feedback.Plagiarised]: {desc: 'plagiarised', colourVar: '--red-600', svg: buildCaseSvg(16)},
        [Feedback.Suspicious]: {desc: 'suspicious', colourVar: '--yellow-700', svg: buildAlertSvg(16)},
    };

    annotateAnswers() {
        const postIdsOnPage = getAnswerIdsOnPage();
        void getSummaryPostActionsFromIds([...postIdsOnPage])
            .then(postResults => {
                this.render(postResults);
            });
    }

    private render(annotatedPosts: SummaryPostActionResponse) {
        Object
            .entries(annotatedPosts)
            .forEach(([postId, eventValues]) => {
                const symbolBar = $('<div class="case-manager-symbol-group d-flex fd-row g2 ba bar-sm p2"></div>');
                eventValues.forEach(e => {
                    if (Object.hasOwn(SummaryAnnotator.iconAttrMap, e)) {
                        const {desc, colourVar, svg} = SummaryAnnotator.iconAttrMap[e];
                        symbolBar.append($(`<div title="This post is noted in the Case Manager System as ${desc}" class="flex--item s-post-summary--stats-item" style="color: var(${colourVar})">${svg}</div>`));
                    }
                });
                $(`#answer-id-${postId} .s-post-summary--stats-item:eq(0)`).before(symbolBar);
            });
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