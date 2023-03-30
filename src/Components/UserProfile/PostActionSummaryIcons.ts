import {getSummaryPostActionsFromIds, type SummaryPostFeedbackResponse} from '../../API/AWSAPI';
import {buildAlertSvg, buildCaseSvg, buildCheckmarkSvg} from '../../Utils/SVGBuilders';

const iconAttrMap: Record<number, { desc: string; colourVar: string; svg: string; }> = {
    [FeedbackIds.LooksOK]: {desc: 'Looks OK', colourVar: '--green-600', svg: buildCheckmarkSvg(16)},
    [FeedbackIds.Plagiarised]: {desc: 'plagiarised', colourVar: '--red-600', svg: buildCaseSvg(16)},
    [FeedbackIds.Suspicious]: {desc: 'suspicious', colourVar: '--yellow-700', svg: buildAlertSvg(16)},
} as const;

function buildSymbolBar(postId: string, eventValues: number[]) {
    const symbolBar = $('<div class="case-manager-symbol-group d-flex fd-row g2 ba bar-sm p2" style="width:min-content"></div>');
    eventValues.forEach(eventId => {
        if (Object.hasOwn(iconAttrMap, eventId)) {
            const {desc, colourVar, svg} = iconAttrMap[eventId];
            symbolBar.append($(`<div title="This post is noted in the Case Manager System as ${desc}" class="flex--item s-post-summary--stats-item" style="color: var(${colourVar})">${svg}</div>`));
        }
    });
    return symbolBar;
}


function getAnswerIdsOnAnswerPage(): Set<string> {
    return new Set($('.s-post-summary').map((i, e) => {
        return e.getAttribute('data-post-id');
    }).toArray());
}

function renderAnswerSummaryIndicators(summaryPostActions: SummaryPostFeedbackResponse) {
    Object
        .entries(summaryPostActions)
        .forEach(
            ([postId, eventValues]) => {
                $(`#answer-id-${postId} .s-post-summary--stats-item:eq(0)`)
                    .before(buildSymbolBar(postId, eventValues));
            }
        );
}

function addSummaryActionIndicators() {
    const postIdsOnPage = getAnswerIdsOnAnswerPage();
    void getSummaryPostActionsFromIds([...postIdsOnPage]).then(renderAnswerSummaryIndicators);
}

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


function getAnswerIdsOnFlagPage(): Set<string> {
    return new Set($('.flagged-post .answer-link a').map((i, e) => {
        const href = e.getAttribute('href');
        if (href === null || !href.includes('#')) {
            return undefined;
        }
        return href.split('#').at(-1);
    }).toArray());
}

function renderFlagSummaryIndicators(summaryPostActions: SummaryPostFeedbackResponse) {
    Object
        .entries(summaryPostActions)
        .forEach(
            ([postId, eventValues]) => {
                const a = $(`a[href$="#${postId}"`);
                a.parent('.answer-link').addClass('d-flex fd-row ai-center g6');
                a.before(buildSymbolBar(postId, eventValues));
            }
        );
}

function addSummaryActionIndicatorsOnFlagPage() {
    const postIdsOnPage = getAnswerIdsOnFlagPage();
    void getSummaryPostActionsFromIds([...postIdsOnPage]).then(renderFlagSummaryIndicators);
}

export function buildFlagSummaryIndicator() {
    addSummaryActionIndicatorsOnFlagPage();
}

