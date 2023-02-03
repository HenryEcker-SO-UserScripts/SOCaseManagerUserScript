import {fetchFromAWS} from '../../API/AWSAPI';
import {type CmNukePostConfig, nukePostDefaultConfigString, nukePostOptions} from '../../API/gmAPI';
import type {FlagOtherResponse, PostDeleteResponse} from '../../API/SEAPI';
import {getModMenuPopoverId} from './ElementIdGenerators';


export function buildModTools(isDeleted: boolean, answerId: number, postOwnerId: number) {
    const baseId = getModMenuPopoverId(answerId);
    const button = $(`<button ${isDeleted ? 'disabled' : ''}  class="ml-auto s-btn s-btn__danger s-btn__outlined s-btn__dropdown" type="button" aria-controls="${baseId}" aria-expanded="false" data-controller="s-popover" data-action="s-popover#toggle" data-s-popover-placement="top-end" data-s-popover-toggle-class="is-selected">Nuke as plagiarism</button>`);
    if (isDeleted) {
        // Don't bother building the popover for deleted posts
        return button;
    }
    return $(document.createDocumentFragment())
        .append(button)
        .append(buildPopOver(baseId, answerId, postOwnerId));
}


function buildPopOver(baseId: string, answerId: number, postOwnerId: number) {
    // Build JQuery Elements For Popover
    const nukePostConfig: CmNukePostConfig = JSON.parse(GM_getValue(nukePostOptions, nukePostDefaultConfigString));
    const {
        textareaLabel,
        textarea,
        checkboxContainer,
        shouldFlagCheckbox,
        shouldCommentCheckbox,
        shouldLogCheckbox
    } = buildNukeOptionElements(baseId, nukePostConfig);
    const lengthSpan = $(`<span>${nukePostConfig.detailText.length}</span>`);
    const nukeButton = $('<button title="Deletes the post, adds a comment, and logs feedback in Case Manager" class="flex--item h32 s-btn s-btn__danger s-btn__outlined s-btn__xs">Nuke</button>');

    // Configure Behaviour for form elements

    nukeButton.on('click', (ev) => {
        ev.preventDefault();
        const [
            isFlagChecked,
            isCommentChecked,
            isLogChecked
        ] = getCheckboxValuesFromInput(shouldFlagCheckbox, shouldCommentCheckbox, shouldLogCheckbox);
        void nukePostAsPlagiarism(
            answerId,
            postOwnerId,
            textarea.val() as string,
            isFlagChecked,
            isCommentChecked,
            isLogChecked
        );
    });

    function updateDisplayBasedOnSelections(ev: JQuery.Event) {
        ev.preventDefault();
        const [
            isFlagChecked,
            isCommentChecked,
            isLogChecked
        ] = getCheckboxValuesFromInput(shouldFlagCheckbox, shouldCommentCheckbox, shouldLogCheckbox);

        // Disable textarea field when not needed
        if (!isFlagChecked && !isCommentChecked) {
            textarea.prop('disabled', true);
        } else {
            textarea.removeProp('disabled');
        }
        nukeButton.attr(
            'title',
            (isFlagChecked ? 'Flags the post, ' : '') +
            (isFlagChecked ? 'deletes' : 'Deletes') + ' the post' +
            (isCommentChecked ? ', adds a comment' : '') +
            (isLogChecked ? ', logs feedback in Case manager' : '')
        );
    }

    shouldCommentCheckbox.on('input', updateDisplayBasedOnSelections);
    shouldFlagCheckbox.on('input', updateDisplayBasedOnSelections);
    shouldLogCheckbox.on('input', updateDisplayBasedOnSelections);

    textarea.on('input', (ev) => {
        ev.preventDefault();
        const length = (ev.target.value as string).length;
        lengthSpan.text(length);
    });

    // Compose JQuery Elements
    return (
        $(`<div class="s-popover" id="${baseId}" role="menu" style="max-width: min-content"><div class="s-popover--arrow"/></div>`)
            .append(
                $('<div class="d-grid g8 ai-center grid__1 ws4"></div>')
                    .append(
                        // Header with text area label to left and link to config on right
                        $('<div class="d-flex fd-row jc-space-between"></div>')
                            .append(textareaLabel)
                            .append(`<a class="fs-fine" href="/users/current${tabIdentifiers.settings}" target="_blank">Configure default options</a>`)
                    )
                    .append(
                        // Input textarea for flag/comment text
                        textarea
                    )
                    .append(
                        // Characters: Length of Textarea text
                        $('<div></div>') // needs to be a div so that the children appear side-by-side instead of vertical grid
                            .append('<span>Characters: </span>')
                            .append(lengthSpan)
                    )
                    .append(
                        // Checkbox container and nuke button
                        $('<div class="d-flex fd-row flex__fl-equal g8"></div>')
                            .append(checkboxContainer)
                            .append(nukeButton)
                    )
            )
    );
}

export function getCheckboxValuesFromInput(...checkboxes: JQuery[]): boolean[] {
    return checkboxes.map(checkbox => checkbox.is(':checked'));
}

export function buildNukeOptionElements(baseId: string, nukePostConfig: CmNukePostConfig) {
    const textareaLabel = $(`<label class="s-label" for="${baseId}-ta">Detail Text:</label>`);
    const textarea: JQuery<HTMLTextAreaElement> = $(`<textarea id="${baseId}-ta" class="s-textarea js-comment-text-input" rows="5"/>`);
    textarea.val(nukePostConfig.detailText);

    const checkboxContainer = $('<div class="flex--item d-flex fd-column g8"></div>');
    const shouldFlagCheckbox = $(`<input class="s-checkbox" type="checkbox" name="flag" id="${baseId}-cb-flag"${nukePostConfig.flag ? ' checked' : ''}/>`);
    const shouldCommentCheckbox = $(`<input class="s-checkbox" type="checkbox" name="comment" id="${baseId}-cb-comment"${nukePostConfig.comment ? ' checked' : ''}/>`);
    const shouldLogCheckbox = $(`<input class="s-checkbox" type="checkbox" name="log" id="${baseId}-cb-log"${nukePostConfig.log ? ' checked' : ''}/>`);

    checkboxContainer
        .append(
            $('<div class="s-check-control"></div>')
                .append(shouldFlagCheckbox)
                .append(`<label class="s-label" for="${baseId}-cb-flag">Flag</label>`)
        )
        .append(
            $('<div class="s-check-control"></div>')
                .append(shouldCommentCheckbox)
                .append(`<label class="s-label" for="${baseId}-cb-comment">Comment</label>`)
        )
        .append(
            $('<div class="s-check-control"></div>')
                .append(shouldLogCheckbox)
                .append(`<label class="s-label" for="${baseId}-cb-log">Log</label>`)
        );
    return {
        textareaLabel,
        textarea,
        checkboxContainer,
        shouldFlagCheckbox,
        shouldCommentCheckbox,
        shouldLogCheckbox
    };
}

async function nukePostAsPlagiarism(answerId: number, ownerId: number, message: string, flagPost = false, commentPost = true, logWithAws = true) {
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
        body['actionIds'] = [Feedback.Plagiarised, Feedback.Deleted];
        void await fetchFromAWS(`/handle/post/${answerId}`, {
            'method': 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });
    }
    window.location.reload();
}