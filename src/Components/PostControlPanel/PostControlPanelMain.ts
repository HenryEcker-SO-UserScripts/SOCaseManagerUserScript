import {getSummaryPostInfoFromIds} from '../../API/AWSAPI';
import {buildActionsComponent} from './PostActionForm';
import {buildNukePostButton, registerNukePostStacksController} from './PostModTools';
import {activateTimelineButton, buildBaseTimelineButtons} from './PostTimeline';


export function buildAnswerControlPanel() {
    const answers = $('div.answer');
    const answerIds = answers.map((i, e) => getAnswerIdFromAnswerDiv(e)).toArray();
    for (const {jAnswer, isDeleted, answerId, postOwnerId} of extractFromAnswerDivs(answers, answerIds)) {
        const controlPanel = $('<div class="p8 g8 d-flex fd-row jc-space-between ai-center"></div>');
        controlPanel.append(buildBaseTimelineButtons(answerId));
        if (StackExchange.options.user.isModerator === true) {
            controlPanel.append(buildNukePostButton(isDeleted, answerId, postOwnerId));
        }
        controlPanel.append(buildActionsComponent(answerId, postOwnerId));
        jAnswer.append(controlPanel);
    }
    if (StackExchange.options.user.isModerator === true) {
        // Only need to do this once per page
        registerNukePostStacksController();
    }
    delayPullSummaryPostInfo(answerIds);
}

function getAnswerIdFromAnswerDiv(answerDiv: HTMLElement): number {
    return Number($(answerDiv).attr('data-answerid'));
}


function* extractFromAnswerDivs(answers: JQuery, answerIds: number[]): Generator<{ jAnswer: JQuery; isDeleted: boolean; answerId: number; postOwnerId: number; }> {
    for (let i = 0; i < answers.length; i++) {
        const jAnswer = $(answers[i]);
        const isDeleted = jAnswer.hasClass('deleted-answer');
        const answerId = answerIds[i];
        const postOwnerId = getPostOwnerIdFromAuthorDiv(jAnswer.find('div[itemprop="author"]'));

        // Skip if answer id cannot be found or if post belongs to the current user
        if (
            answerId === undefined ||
            postOwnerId === StackExchange.options.user.userId
        ) {
            continue;
        }

        yield {
            jAnswer,
            isDeleted,
            answerId,
            postOwnerId
        };
    }
}

function delayPullSummaryPostInfo(answerIds: number[]) {
    getSummaryPostInfoFromIds(answerIds)
        .then(setPostIds => {
            for (const postId of setPostIds) {
                activateTimelineButton(postId);
            }
        })
        .catch(err => {
            console.error(err);
        });
}


function getPostOwnerIdFromAuthorDiv(authorDiv: JQuery): number {
    const e = $(authorDiv).find('a');
    if (e.length === 0) {
        return -1; // jQuery.map removes null/undefined values
    }
    const href = e.attr('href');
    if (href === undefined) {
        return -1;
    }
    const match = href.match(/\/users\/(\d+)\/.*/);
    if (match === null) {
        return -1;
    }
    return Number(match[1]);
}