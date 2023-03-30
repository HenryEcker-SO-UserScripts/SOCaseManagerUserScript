import {fetchFromAWS, type PostFeedbackType} from '../../API/AWSAPI';
import {
    getFeedbackButtonId,
    getFeedbackPopoverId,
    getTimelineButtonId,
    popoverMountPointClass
} from './ElementIdGenerators';
import {activateTimelineButton} from './PostTimeline';


export function buildFeedbackComponent(answerId: number, ownerId: number, isDeleted: boolean) {
    const controlButton = $(
        `<button id="${getFeedbackButtonId(answerId)}" title="Click to record your feedback on this post." class="s-btn s-btn__dropdown" role="button" aria-controls="${getFeedbackPopoverId(answerId)}" aria-expanded="false" data-controller="s-popover" data-action="s-popover#toggle" data-s-popover-placement="top-end" data-s-popover-toggle-class="is-selected">Record Post Feedback</button>`
    );

    const popOver = $(
        `<div class="s-popover" style="width: 275px;" id="${getFeedbackPopoverId(answerId)}" role="menu"><div class="s-popover--arrow"/><div class="${popoverMountPointClass}"></div></div>`
    );

    controlButton.on('click', (ev) => {
        ev.preventDefault();
        if (controlButton.attr('options-loaded') !== 'true') {
            // Empty mount point and add loading indicator
            $(`#${getFeedbackPopoverId(answerId)} > .${popoverMountPointClass}`)
                .empty()
                .append('<div class="is-loading">Loading…</div>');

            // Fetch current feedback
            void fetchFromAWS(`/handle/post/${answerId}`)
                .then(res => res.json() as Promise<PostFeedbackType[]>)
                .then(feedbacks => {
                    // Build Component
                    buildFeedbackComponentFromFeedback(answerId, ownerId, isDeleted, feedbacks);
                    // Prevent multiple loads
                    controlButton.attr('options-loaded', 'true');
                });
        }
    });

    return $(document.createDocumentFragment())
        .append(controlButton)
        .append(popOver);
}

function buildFeedbackComponentFromFeedback(answerId: number, ownerId: number, isDeleted: boolean, feedbacks: PostFeedbackType[]) {
    const popOverInnerContainer = $('<div class="case-manager-post-action-container"><h3>Case Manager Post Feedback Panel</h3></div>');
    const feedbackForm = $('<form class="d-grid grid__1 g6" style="grid-auto-rows: 1fr"></form>');
    const radioGroupName = `radio-action-${answerId}`;
    let userHasAnyFeedback = false;
    for (const feedback of feedbacks) {
        const feedbackItemRow = $('<div class="grid--item d-flex fd-row jc-space-between ai-center"></div>');
        // Build Radio Box
        const radioId = getFeedbackRadioId(answerId, feedback['feedback_id']);
        const radioButton = $(`<div class="flex--item s-check-control"><input class="s-radio" type="radio" name="${radioGroupName}" value="${feedback['feedback_description']}" data-action-id="${feedback['feedback_id']}" id="${radioId}"${feedback['has_given_feedback'] ? ' checked' : ''}/><label class="flex--item s-label fw-normal" for="${radioId}">${feedback['feedback_description']}</label></div>`);
        feedbackItemRow.append(radioButton);
        // Conditionally Build Clear Button
        if (feedback['has_given_feedback']) {
            userHasAnyFeedback = true;
            const clearButton = $('<button class="s-btn s-btn__danger" type="button">Clear</button>');
            clearButton.on('click', clearMyFeedbackHandler(feedback, answerId));
            feedbackItemRow.append(clearButton);
        }
        // Add to Form
        feedbackForm.append(feedbackItemRow);
    }
    if (userHasAnyFeedback) {
        // Disable all radio buttons
        feedbackForm.find(`input[name="${radioGroupName}"]`).prop('disabled', true);
    }

    feedbackForm.append($(`
<div class="d-flex fd-row jc-start">
    <button class="s-btn s-btn__primary" type="submit"${userHasAnyFeedback ? ' disabled' : ''}>Save</button>
    <button class="s-btn" type="reset"${userHasAnyFeedback ? ' disabled' : ''}>Reset</button>
</div>
`));

    feedbackForm.on('submit', handleSubmitFeedback(feedbackForm, answerId, ownerId, isDeleted));

    popOverInnerContainer.append(feedbackForm);

    $(`#${getFeedbackPopoverId(answerId)} > .${popoverMountPointClass}`)
        .empty()
        .append(popOverInnerContainer);
}

function getFeedbackRadioId(answerId: number, feedback_id: number): string {
    return `radio-button-${answerId}-${feedback_id}`;
}


function clearMyFeedbackHandler(
    feedback: PostFeedbackType,
    answerId: number
) {
    return (ev: JQuery.Event) => {
        ev.preventDefault();
        void StackExchange.helpers.showConfirmModal(
            {
                title: 'Remove your feedback',
                bodyHtml: `<span>Are you sure you want to remove your "${feedback['feedback_description']}" feedback from this post?</span>`,
                buttonLabel: 'Remove Feedback',
            }
        ).then((confirm: boolean) => {
            if (confirm) {
                void fetchFromAWS(
                    `/handle/post/${answerId}/${feedback['feedback_id']}`,
                    {'method': 'DELETE'}
                ).then(res => {
                    if (res.status === 200) {
                        // Mark options as unloaded (will re-fetch when opened next)
                        $(`#${getFeedbackButtonId(answerId)}`).attr('options-loaded', 'false');
                        // Mark timeline button as unloaded (will re-fetch when opened the next time)
                        $(`#${getTimelineButtonId(answerId)}`).attr('timeline-loaded', 'false');
                    }
                });
            }
        });
    };
}

function handleSubmitFeedback(form: JQuery, answerId: number, ownerId: number, isDeleted: boolean) {
    return (ev: JQuery.Event) => {
        ev.preventDefault();
        const submitButton = form.find('button[type="submit"]');
        submitButton.prop('disabled', true); // disable button (to prevent multiple calls)
        const feedbacks = form.find('input[type="radio"]:checked:not(:disabled)');
        if (feedbacks.length === 0) {
            submitButton.prop('disabled', false); // un-disable button (action is completed)
            return;
        }
        const body: {
            postOwnerId?: number;
            feedbackIds?: number[];
        } = {};
        if (ownerId !== -1) {
            body['postOwnerId'] = ownerId;
        }
        const parsedFeedbacks = feedbacks.map((i, e) => {
            const id = $(e).attr('data-action-id');
            if (id === undefined) {
                return undefined;
            } else {
                return Number(id);
            }
        }).toArray();
        // When providing feedback on deleted posts, automatically include Deleted feedback
        if (isDeleted) {
            parsedFeedbacks.push(FeedbackIds.Deleted);
        }
        body['feedbackIds'] = parsedFeedbacks;

        fetchFromAWS(`/handle/post/${answerId}`, {
            'method': 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        })
            .then(res => res.json() as Promise<PostFeedbackType[]>)
            .then(feedbacks => {
                // Rebuild timeline button (will enable button if it is disabled; will reset pull down state if already exists)
                activateTimelineButton(answerId);
                // Rebuild component from new feedbacks (returned from server)
                buildFeedbackComponentFromFeedback(answerId, ownerId, isDeleted, feedbacks);
            })
            .catch(() => {
                // Attach listener again if errors
                submitButton.prop('disabled', false);
            });
    };
}

