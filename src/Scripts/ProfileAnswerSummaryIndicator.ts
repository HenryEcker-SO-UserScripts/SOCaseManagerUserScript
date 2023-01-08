import {Feedback, getSummaryPostActionsFromIds, type SummaryPostActionResponse} from '../AWSAPI';
import {buildAlertSvg, buildCaseSvg, buildCheckmarkSvg, buildEditPenSvg} from '../SVGBuilders';

export function buildAnswerSummaryIndicator() {
    addSummaryActionIndicators();
    // The escape \\ is for the ? that comes with the variable
    const matchPattern = new RegExp(`users/tab/\\d+\\${tabIdentifiers.userAnswers}`, 'gi');
    // Handle buttons on tab/page navigation
    $(document).on('ajaxComplete', (_0, _1, {url}) => {
        if (url.match(matchPattern)) {
            addSummaryActionIndicators();
        }
    });
}

function getAnswerIdsOnPage(): Set<string> {
    return new Set($('.s-post-summary').map((i, e) => {
        return e.getAttribute('data-post-id');
    }).toArray());
}

function addSummaryActionIndicators() {
    const postIdsOnPage = getAnswerIdsOnPage();
    void getSummaryPostActionsFromIds([...postIdsOnPage]).then(renderAnswerSummaryIndicators);
}


const iconAttrMap: {
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
} as const;

function buildSymbolBar(postId: string, eventValues: number[]) {
    const symbolBar = $('<div class="case-manager-symbol-group d-flex fd-row g2 ba bar-sm p2"></div>');
    eventValues.forEach(eventId => {
        if (Object.hasOwn(iconAttrMap, eventId)) {
            const {desc, colourVar, svg} = iconAttrMap[eventId];
            symbolBar.append($(`<div title="This post is noted in the Case Manager System as ${desc}" class="flex--item s-post-summary--stats-item" style="color: var(${colourVar})">${svg}</div>`));
        }
    });
    return symbolBar;

}

function renderAnswerSummaryIndicators(summaryPostActions: SummaryPostActionResponse) {
    Object
        .entries(summaryPostActions)
        .forEach(
            ([postId, eventValues]) => {
                $(`#answer-id-${postId} .s-post-summary--stats-item:eq(0)`)
                    .before(buildSymbolBar(postId, eventValues));
            }
        );
}