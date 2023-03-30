import {fetchFromAWS, type PostActionType} from '../../API/AWSAPI';
import {
    getActionsButtonId,
    getActionsPopoverId,
    getTimelineButtonId,
    popoverMountPointClass
} from './ElementIdGenerators';
import {activateTimelineButton} from './PostTimeline';


export function buildActionsComponent(answerId: number, ownerId: number) {
    const controlButton = $(
        `<button id="${getActionsButtonId(answerId)}" title="Click to record an action you have taken on this post." class="s-btn s-btn__dropdown" role="button" aria-controls="${getActionsPopoverId(answerId)}" aria-expanded="false" data-controller="s-popover" data-action="s-popover#toggle" data-s-popover-placement="top-end" data-s-popover-toggle-class="is-selected">Record Post Action</button>`
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

    return $(document.createDocumentFragment())
        .append(controlButton)
        .append(popOver);
}

function buildActionsComponentFromActions(answerId: number, ownerId: number, actions: PostActionType[]) {
    const popOverInnerContainer = $('<div class="case-manager-post-action-container"><h3>Case Manager Post Action Panel</h3></div>');
    const actionsForm = $('<form class="d-grid grid__1 g6" style="grid-auto-rows: 1fr"></form>');
    const radioGroupName = `radio-action-${answerId}`;
    let hasAnyAction = false;
    for (const action of actions) {
        const actionRow = $('<div class="grid--item d-flex fd-row jc-space-between ai-center"></div>');
        // Build Radio Box
        const radioId = getActionRadioButtonId(answerId, action['action_id']);
        const radioButton = $(`<div class="flex--item s-check-control"><input class="s-radio" type="radio" name="${radioGroupName}" value="${action['action_description']}" data-action-id="${action['action_id']}" id="${radioId}"${action['user_acted'] ? ' checked' : ''}/><label class="flex--item s-label fw-normal" for="${radioId}">${action['action_description']}</label></div>`);
        actionRow.append(radioButton);
        // Conditionally Build Clear Button
        if (action['user_acted']) {
            hasAnyAction = true;
            const clearButton = $('<button class="s-btn s-btn__danger" type="button">Clear</button>');
            clearButton.on('click', clearMyActionHandler(action, answerId));
            actionRow.append(clearButton);
        }
        // Add to Form
        actionsForm.append(actionRow);
    }
    if (hasAnyAction) {
        // Disable all radio buttons
        actionsForm.find(`input[name="${radioGroupName}"]`).prop('disabled', true);
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
}

function getActionRadioButtonId(answerId: number, action_id: number): string {
    return `radio-button-${answerId}-${action_id}`;
}


function clearMyActionHandler(
    action: PostActionType,
    answerId: number
) {
    return (ev: JQuery.Event) => {
        ev.preventDefault();
        void StackExchange.helpers.showConfirmModal(
            {
                title: 'Remove your action',
                bodyHtml: `<span>Are you sure you want to remove your "${action['action_description']}" action from this post?</span>`,
                buttonLabel: 'Remove Action',
            }
        ).then((confirm: boolean) => {
            if (confirm) {
                void fetchFromAWS(
                    `/handle/post/${answerId}/${action['action_id']}`,
                    {'method': 'DELETE'}
                ).then(res => {
                    if (res.status === 200) {
                        // Mark options as unloaded (will re-fetch when opened next)
                        $(`#${getActionsButtonId(answerId)}`).attr('options-loaded', 'false');
                        // Mark timeline button as unloaded (will re-fetch when opened the next time)
                        $(`#${getTimelineButtonId(answerId)}`).attr('timeline-loaded', 'false');
                    }
                });
            }
        });
    };
}

function handleFormAction(form: JQuery, answerId: number, ownerId: number) {
    return (ev: JQuery.Event) => {
        ev.preventDefault();
        const submitButton = form.find('button[type="submit"]');
        submitButton.prop('disabled', true); // disable button (to prevent multiple calls)
        const actions = form.find('input[type="radio"]:checked:not(:disabled)');
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
}

