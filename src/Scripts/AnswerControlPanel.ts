import type {FlagOtherResponse, PostDeleteResponse} from '../SEAPI';
import {type StackExchangeAPI} from '../SEAPI';
import {buildAlertSvg} from '../SVGBuilders';
import {fetchFromAWS, getSummaryPostInfoFromIds} from '../AWSAPI';

declare const StackExchange: StackExchangeAPI;

interface PostActionType {
    action_id: number;
    action_description: string;
    user_acted: boolean;
}

const popoverMountPointClass = 'popover-mount-point';

/* ACTIONS POPOVER AND BUTTON */

const getActionsPopoverId = (answerId: number): string => {
    return `case-manager-answer-popover-${answerId}`;
};

const getActionCheckboxId = (answerId: number, action_id: number): string => {
    return `checkbox-${answerId}-${action_id}`;
};

const getModMenuPopoverId = (answerId: number): string => {
    return `case-manager-mod-menu-popover-${answerId}`;
};


const clearMyActionHandler = (
    action: PostActionType,
    answerId: number,
    checkboxId: string,
    clearButton: JQuery<HTMLElement>
) => (ev: JQuery.Event) => {
    ev.preventDefault();
    void StackExchange.helpers.showConfirmModal(
        {
            title: 'Remove your action',
            bodyHtml: `<span>Are you sure you want to remove your "${action['action_description']}" action from this post?</span>`,
            buttonLabel: 'Remove Action',
        }
    ).then((confirm: boolean) => {
        if (confirm) {
            // Uncheck Checkbox
            void fetchFromAWS(
                `/handle/post/${answerId}/${action['action_id']}`,
                {'method': 'DELETE'}
            ).then(res => {
                if (res.status === 200) {
                    // Re-enable Checkbox
                    $(`#${checkboxId}`)
                        .prop('checked', false)
                        .prop('disabled', false);
                    // Remove Clear Button
                    clearButton.remove();
                    // Mark timeline button as unloaded (will re-fetch when opened the next time)
                    $(`#${getTimelineButtonId(answerId)}`).attr('timeline-loaded', 'false');
                }
            });
        }
    });
};

const handleFormAction = (form: JQuery, answerId: number, ownerId: number) => (ev: JQuery.Event) => {
    ev.preventDefault();
    const submitButton = form.find('button[type="submit"]');
    submitButton.prop('disabled', true); // disable button (to prevent multiple calls)
    const actions = form.find('input[type="checkbox"]:checked:not(:disabled)');
    if (actions.length === 0) {
        submitButton.prop('disabled', false); // un-disable button (action is completed)
        return;
    }
    const body: {
        postOwnerId?: number;
        actionIds?: number[];
    } = {};
    if (ownerId !== -1) {
        body['postOwnerId'] = ownerId;
    }
    body['actionIds'] = actions.map((i, e) => {
        const id = $(e).attr('data-action-id');
        if (id === undefined) {
            return undefined;
        } else {
            return Number(id);
        }
    }).toArray();

    fetchFromAWS(`/handle/post/${answerId}`, {
        'method': 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
    })
        .then(res => res.json() as Promise<PostActionType[]>)
        .then(actions => {
            // Rebuild timeline button (will enable button if it is disabled; will reset pull down state if already exists)
            activateTimelineButton(answerId);
            // Rebuild component from new actions (returned from server)
            buildActionsComponentFromActions(answerId, ownerId, actions);
        })
        .catch(() => {
            // Attach listener again if errors
            submitButton.prop('disabled', false);
        });
};


const buildActionsComponentFromActions = (answerId: number, ownerId: number, actions: PostActionType[]) => {
    const popOverInnerContainer = $('<div class="case-manager-post-action-container"><h3>Case Manager Post Action Panel</h3></div>');
    const actionsForm = $('<form class="d-grid grid__1 g6" style="grid-auto-rows: 1fr"></form>');
    for (const action of actions) {
        const actionRow = $('<div class="grid--item d-flex fd-row jc-space-between ai-center"></div>');
        // Build Check Box
        const checkboxId = getActionCheckboxId(answerId, action['action_id']);
        const checkbox = $(`<div class="d-flex g8"><div class="flex--item"><input class="s-checkbox" type="checkbox" name="${action['action_description']}" data-action-id="${action['action_id']}" id="${checkboxId}" ${action['user_acted'] ? 'checked disabled' : ''}/></div><label class="flex--item s-label fw-normal" for="${checkboxId}">${action['action_description']}</label></div>`);
        actionRow.append(checkbox);
        // Conditionally Build Clear Button
        if (action['user_acted']) {
            const clearButton = $('<button class="s-btn s-btn__danger" type="button">Clear</button>');
            clearButton.on('click', clearMyActionHandler(action, answerId, checkboxId, clearButton));
            actionRow.append(clearButton);
        }
        // Add to Form
        actionsForm.append(actionRow);
    }

    actionsForm.append($(`
<div class="d-flex fd-row jc-start">
    <button class="s-btn s-btn__primary" type="submit">Save</button>
    <button class="s-btn" type="reset">Reset</button>
</div>
`));

    actionsForm.on('submit', handleFormAction(actionsForm, answerId, ownerId));

    popOverInnerContainer.append(actionsForm);

    $(`#${getActionsPopoverId(answerId)} > .${popoverMountPointClass}`)
        .empty()
        .append(popOverInnerContainer);
};

const buildActionsComponent = (mountPoint: JQuery, answerId: number, ownerId: number) => {
    const controlButton = $(
        `<button title="Click to record an action you have taken on this post." class="s-btn s-btn__dropdown" role="button" aria-controls="${getActionsPopoverId(answerId)}" aria-expanded="false" data-controller="s-popover" data-action="s-popover#toggle" data-s-popover-placement="top-end" data-s-popover-toggle-class="is-selected">Record Post Action</button>`
    );

    const popOver = $(
        `<div class="s-popover" id="${getActionsPopoverId(answerId)}" role="menu"><div class="s-popover--arrow"/><div class="${popoverMountPointClass}"><div class="is-loading">Loading…</div></div></div>`
    );

    controlButton.on('click', (ev) => {
        ev.preventDefault();
        if (controlButton.attr('options-loaded') !== 'true') {
            void fetchFromAWS(`/handle/post/${answerId}`)
                .then(res => res.json() as Promise<PostActionType[]>)
                .then(actions => {
                    buildActionsComponentFromActions(answerId, ownerId, actions);
                    // Prevent multiple loads
                    controlButton.attr('options-loaded', 'true');
                });
        }
    });


    mountPoint.append(controlButton);
    mountPoint.append(popOver);
};

/* ACTIONS POST TIMELINE POPOVER AND BUTTON */

const getTimelineButtonId = (answerId: number): string => {
    return `${answerId}-timeline-indicator-button`;
};

const getTimelinePopoverId = (answerId: number): string => {
    return `case-manager-timeline-popover-${answerId}`;
};
const buildBaseTimelineButtons = (mountPoint: JQuery, answerId: number) => {
    const controlButton = $(`<button id="${getTimelineButtonId(answerId)}" class="flex--item s-btn s-btn__danger ws-nowrap" type="button" disabled>Post Timeline</button>`);
    const popOver = $(
        `<div class="s-popover" style="max-width: max-content;" id="${getTimelinePopoverId(answerId)}" role="menu"><div class="s-popover--arrow"/><div class="${popoverMountPointClass}"><div class="is-loading">Loading…</div></div></div>`
    );
    mountPoint.append(controlButton);
    mountPoint.append(popOver);
};

const buildActiveTimelineButton = (buttonId: string, answerId: number) => {
    const timelinePopoverId = getTimelinePopoverId(answerId);
    const timelineButton = $(`<button title="Click to view a record of actions taken on this post." id="${buttonId}" class="flex--item s-btn s-btn__danger s-btn__icon ws-nowrap s-btn__dropdown"  role="button" aria-controls="${timelinePopoverId}" aria-expanded="false" data-controller="s-popover" data-action="s-popover#toggle" data-s-popover-placement="top-start" data-s-popover-toggle-class="is-selected">${buildAlertSvg()}<span class="px8">Post Timeline</span></button>`);
    timelineButton.on('click', (ev) => {
        ev.preventDefault();
        if (timelineButton.attr('timeline-loaded') !== 'true') {
            void fetchFromAWS(`/timeline/post/${answerId}`)
                .then(res => res.json() as Promise<{ timeline_event_type: number; event_creation_date: string; display_name: string; account_id: number; timeline_event_description: string; }[]>)
                .then(timelineEvents => {
                    const eventPane = $('<div class="case-manager-post-timeline-container"></div>');
                    eventPane.append($('<h3>Case Manager Post Timeline</h3>'));
                    const timelineEventContainer = $('<div class="d-grid ws-nowrap" style="grid-template-columns: repeat(3, min-content); grid-gap: var(--su8);"></div>');
                    for (const event of timelineEvents) {
                        timelineEventContainer.append(
                            $(`<a href="/users/${event['account_id']}">${event['display_name']}</a><span data-event-type-id="${event['timeline_event_type']}">${event['timeline_event_description']}</span><span>${new Date(event['event_creation_date']).toLocaleString()}</span>`)
                        );
                    }
                    eventPane.append(timelineEventContainer);

                    $(`#${timelinePopoverId} > .${popoverMountPointClass}`)
                        .empty()
                        .append(eventPane);

                    // prevent multiple loads
                    timelineButton.attr('timeline-loaded', 'true');
                });
        }
    });
    return timelineButton;
};

const activateTimelineButton = (postId: number) => {
    const id = getTimelineButtonId(postId);
    $(`#${id}`).replaceWith(buildActiveTimelineButton(id, postId));
};


const delayPullSummaryPostInfo = (answerIds: number[]) => {
    getSummaryPostInfoFromIds(answerIds)
        .then(setPostIds => {
            for (const postId of setPostIds) {
                activateTimelineButton(postId);
            }
        })
        .catch(err => {
            console.error(err);
        });
};


const nukePostAsPlagiarism = async (answerId: number, ownerId: number, message: string, flagPost = false, commentPost = true, logWithAws = true) => {
    // Flag limit is 10-500
    if (flagPost && (message.length < 10 || message.length > 500)) {
        StackExchange.helpers.showToast('Flags must be between 10 and 500 characters. Either add text or disable the flagging option.', {type: 'danger'});
        return;
    }
    // Comment limit is 15-600
    if (commentPost && (message.length < 15 || message.length > 600)) {
        StackExchange.helpers.showToast('Comments must be between 10 and 600 characters. Either add text or disable the comment option.', {type: 'danger'});
        return;

    }
    if (flagPost) {
        const flagFd = new FormData();
        flagFd.set('fkey', StackExchange.options.user.fkey);
        flagFd.set('otherText', message);
        const flagFetch: FlagOtherResponse = await fetch(`/flags/posts/${answerId}/add/PostOther`, {
            body: flagFd,
            method: 'POST'
        }).then(res => res.json());
        if (!flagFetch.Success) {
            StackExchange.helpers.showToast(flagFetch.Message);
            return; // don't continue
        }
    }

    const deleteFd = new FormData();
    deleteFd.set('fkey', StackExchange.options.user.fkey);
    const deleteFetch: PostDeleteResponse = await fetch(`/posts/${answerId}/vote/10`, {
        body: deleteFd,
        method: 'POST'
    }).then(res => res.json());

    if (!deleteFetch.Success) {
        return; // Deletion failed don't continue
    }
    if (commentPost) {
        const commentFd = new FormData();
        commentFd.set('fkey', StackExchange.options.user.fkey);
        commentFd.set('comment', message);
        await void fetch(`/posts/${answerId}/comments`, {body: commentFd, method: 'POST'});
    }
    if (logWithAws) {
        const body: {
            postOwnerId?: number;
            actionIds?: number[];
        } = {};
        if (ownerId !== -1) {
            body['postOwnerId'] = ownerId;
        }
        body['actionIds'] = [3, 4]; // Plagiarised and Deleted
        void await fetchFromAWS(`/handle/post/${answerId}`, {
            'method': 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });
    }
    window.location.reload();
};


const hasCheckedChild = (e: JQuery<HTMLElement>): boolean => {
    return (e.find('input[type="checkbox"]') as JQuery<HTMLInputElement>).is(':checked');
};

const buildModTools = (mountPoint: JQuery, isDeleted: boolean, answerId: number, postOwnerId: number) => {
    const baseId = getModMenuPopoverId(answerId);
    const button = $(`<button ${isDeleted ? 'disabled' : ''}  class="ml-auto s-btn s-btn__danger s-btn__outlined s-btn__dropdown" type="button" aria-controls="${baseId}" aria-expanded="false" data-controller="s-popover" data-action="s-popover#toggle" data-s-popover-placement="top-end" data-s-popover-toggle-class="is-selected">Nuke as plagiarism</button>`);
    const popOver = $(
        `<div class="s-popover" id="${baseId}" role="menu" style="max-width: min-content"><div class="s-popover--arrow"/></div>`
    );
    const container = $('<div class="d-grid g8 ai-center grid__1 ws4"></div>');
    const label = $(`<label class="s-label" for="${baseId}-ta">Detail Text:</label>`);
    const input: JQuery<HTMLInputElement> = $(`<textarea id="${baseId}-ta" class="s-textarea js-comment-text-input" rows="5"/>`);
    container.append(label);
    container.append(input);

    const baseText = 'Copied without attribution from ';
    input.val(baseText);
    const lengthSpan = $(`<span>${baseText.length}</span>`);
    {
        const wrapper = $('<div></div>');
        wrapper.append('<span>Characters: </span>');
        wrapper.append(lengthSpan);
        container.append(wrapper);
    }
    {
        const flagContainer = $('<div class="d-flex fd-row flex__fl-equal g8"></div>');
        const checkboxContainer = $('<div class="flex--item d-flex fd-column g8"></div>');
        const shouldFlagCheckbox = $(`<div class="s-check-control"><input class="s-checkbox" type="checkbox" name="flag" id="${baseId}-cb-flag" /><label class="s-label" for="${baseId}-cb-flag">Flag</label></div>`);
        const shouldCommentCheckbox = $(`<div class="s-check-control"><input class="s-checkbox" type="checkbox" name="comment" id="${baseId}-cb-comment" checked/><label class="s-label" for="${baseId}-cb-comment">Comment</label></div>`);
        const shouldLogCheckbox = $(`<div class="s-check-control"><input class="s-checkbox" type="checkbox" name="log" id="${baseId}-cb-log" checked/><label class="s-label" for="${baseId}-cb-log">Log</label></div>`);

        checkboxContainer.append(shouldFlagCheckbox);
        checkboxContainer.append(shouldCommentCheckbox);
        checkboxContainer.append(shouldLogCheckbox);

        const nukeButton = $('<button title="Deletes the post, adds a comment, and logs feedback in Case Manager" class="flex--item h32 s-btn s-btn__danger s-btn__outlined s-btn__xs">Nuke</button>');
        nukeButton.on('click', (ev) => {
            ev.preventDefault();
            void nukePostAsPlagiarism(
                answerId,
                postOwnerId,
                input.val() as string,
                hasCheckedChild(shouldFlagCheckbox),
                hasCheckedChild(shouldCommentCheckbox),
                hasCheckedChild(shouldLogCheckbox)
            );
        });

        const updateDisplayBasedOnSelections = (ev: JQuery.Event) => {
            ev.preventDefault();
            const isFlaggingActive = hasCheckedChild(shouldFlagCheckbox);
            const isCommentingActive = hasCheckedChild(shouldCommentCheckbox);

            // Disable textarea field when not needed
            if (!isFlaggingActive && !isCommentingActive) {
                input.prop('disabled', true);
            } else {
                input.removeProp('disabled');
            }
            nukeButton.attr(
                'title',
                (isFlaggingActive ? 'Flags the post, ' : '') +
                (isFlaggingActive ? 'deletes' : 'Deletes') + ' the post' +
                (isCommentingActive ? ', adds a comment' : '') +
                (hasCheckedChild(shouldLogCheckbox) ? ', logs feedback in Case manager' : '')
            );
        };

        (shouldCommentCheckbox.find('input[type="checkbox"]') as JQuery<HTMLInputElement>).on('input', updateDisplayBasedOnSelections);
        (shouldFlagCheckbox.find('input[type="checkbox"]') as JQuery<HTMLInputElement>).on('input', updateDisplayBasedOnSelections);
        (shouldLogCheckbox.find('input[type="checkbox"]') as JQuery<HTMLInputElement>).on('input', updateDisplayBasedOnSelections);
        input.on('input', (ev) => {
            ev.preventDefault();
            const length = (ev.target.value as string).length;
            lengthSpan.text(length);
        });

        flagContainer.append(checkboxContainer);
        flagContainer.append(nukeButton);
        container.append(flagContainer);
    }
    popOver.append(container);
    mountPoint.append(button);
    mountPoint.append(popOver);
};


export const buildAnswerControlPanel = async () => {
    const answers = $('div.answer');
    const answerIds = answers.map((i, e) => Number($(e).attr('data-answerid'))).toArray();
    const ownerIds = answers.find('div[itemprop="author"]').map((i, postAuthor) => {

        const e = $(postAuthor).find('a');
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
    });

    if (answers.length > 0) {
        for (let i = 0; i < answers.length; i++) {
            const jAnswer = $(answers[i]);
            const isDeleted = jAnswer.hasClass('deleted-answer');
            const answerId = answerIds[i];
            const postOwnerId = ownerIds[i];
            // Skip if answer id cannot be found or if post belongs to the current user
            if (
                answerId === undefined ||
                postOwnerId === StackExchange.options.user.userId
            ) {
                continue;
            }
            const controlPanel = $('<div class="p8 g8 d-flex fd-row jc-space-between ai-center"></div>');
            buildBaseTimelineButtons(controlPanel, answerId);
            if (StackExchange.options.user.isModerator) {
                buildModTools(controlPanel, isDeleted, answerId, postOwnerId);
            }
            buildActionsComponent(controlPanel, answerId, postOwnerId);
            jAnswer.append(controlPanel);
        }
        delayPullSummaryPostInfo(answerIds);
    }
};