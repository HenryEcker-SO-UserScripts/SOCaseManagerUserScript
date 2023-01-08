import {fetchFromAWS} from '../../AWSAPI';
import {buildAlertSvg} from '../../SVGBuilders';
import {
    getTimelineButtonId,
    getTimelinePopoverId,
    popoverMountPointClass
} from './ElementIdGenerators';


export function buildBaseTimelineButtons(answerId: number) {
    const controlButton = $(`<button id="${getTimelineButtonId(answerId)}" class="flex--item s-btn s-btn__danger ws-nowrap" type="button" disabled>Post Timeline</button>`);
    const popOver = $(
        `<div class="s-popover" style="max-width: max-content;" id="${getTimelinePopoverId(answerId)}" role="menu"><div class="s-popover--arrow"/><div class="${popoverMountPointClass}"><div class="is-loading">Loading…</div></div></div>`
    );
    return $(document.createDocumentFragment())
        .append(controlButton)
        .append(popOver);
}

export function activateTimelineButton(postId: number) {
    const id = getTimelineButtonId(postId);
    $(`#${id}`).replaceWith(buildActiveTimelineButton(id, postId));
}


function buildActiveTimelineButton(buttonId: string, answerId: number) {
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
}