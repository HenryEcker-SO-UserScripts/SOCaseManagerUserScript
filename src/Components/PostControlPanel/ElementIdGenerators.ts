export const popoverMountPointClass = 'popover-mount-point';

export function getTimelineButtonId(answerId: number): string {
    return `${answerId}-timeline-indicator-button`;
}

export function getTimelinePopoverId(answerId: number): string {
    return `case-manager-timeline-popover-${answerId}`;
}

export function getActionsPopoverId(answerId: number): string {
    return `case-manager-answer-popover-${answerId}`;
}