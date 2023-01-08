import {Feedback, fetchFromAWS} from '../AWSAPI';
import {type CmNukePostConfig, nukePostDefaultConfigString, nukePostOptions} from '../gmAPI';
import type {FlagOtherResponse, PostDeleteResponse, StackExchangeAPI} from '../SEAPI';


declare const StackExchange: StackExchangeAPI;

const getModMenuPopoverId = (answerId: number): string => {
    return `case-manager-mod-menu-popover-${answerId}`;
};

export const hasCheckedChild = (e: JQuery): boolean => {
    return (e.find('input[type="checkbox"]') as JQuery<HTMLInputElement>).is(':checked');
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
};

export const buildNukeOptionControls = (baseId: string, nukePostConfig: CmNukePostConfig) => {
    const textareaLabel = $(`<label class="s-label" for="${baseId}-ta">Detail Text:</label>`);
    const textarea: JQuery<HTMLInputElement> = $(`<textarea id="${baseId}-ta" class="s-textarea js-comment-text-input" rows="5"/>`);
    textarea.val(nukePostConfig.detailText);

    const checkboxContainer = $('<div class="flex--item d-flex fd-column g8"></div>');
    const shouldFlagCheckbox = $(`<div class="s-check-control"><input class="s-checkbox" type="checkbox" name="flag" id="${baseId}-cb-flag"${nukePostConfig.flag ? ' checked' : ''}/><label class="s-label" for="${baseId}-cb-flag">Flag</label></div>`);
    const shouldCommentCheckbox = $(`<div class="s-check-control"><input class="s-checkbox" type="checkbox" name="comment" id="${baseId}-cb-comment"${nukePostConfig.comment ? ' checked' : ''}/><label class="s-label" for="${baseId}-cb-comment">Comment</label></div>`);
    const shouldLogCheckbox = $(`<div class="s-check-control"><input class="s-checkbox" type="checkbox" name="log" id="${baseId}-cb-log"${nukePostConfig.log ? ' checked' : ''}/><label class="s-label" for="${baseId}-cb-log">Log</label></div>`);

    checkboxContainer.append(shouldFlagCheckbox);
    checkboxContainer.append(shouldCommentCheckbox);
    checkboxContainer.append(shouldLogCheckbox);
    return {
        textareaLabel,
        textarea,
        checkboxContainer,
        shouldFlagCheckbox,
        shouldCommentCheckbox,
        shouldLogCheckbox
    };
};

export const buildModTools = (isDeleted: boolean, answerId: number, postOwnerId: number) => {
    const baseId = getModMenuPopoverId(answerId);
    const button = $(`<button ${isDeleted ? 'disabled' : ''}  class="ml-auto s-btn s-btn__danger s-btn__outlined s-btn__dropdown" type="button" aria-controls="${baseId}" aria-expanded="false" data-controller="s-popover" data-action="s-popover#toggle" data-s-popover-placement="top-end" data-s-popover-toggle-class="is-selected">Nuke as plagiarism</button>`);
    if (isDeleted) {
        // Don't bother building the popover for deleted posts
        return button;
    }
    const popOver = $(
        `<div class="s-popover" id="${baseId}" role="menu" style="max-width: min-content"><div class="s-popover--arrow"/></div>`
    );

    const nukePostConfig: CmNukePostConfig = JSON.parse(GM_getValue(nukePostOptions, nukePostDefaultConfigString));
    const {
        textareaLabel,
        textarea,
        checkboxContainer,
        shouldFlagCheckbox,
        shouldCommentCheckbox,
        shouldLogCheckbox
    } = buildNukeOptionControls(baseId, nukePostConfig);
    const container = $('<div class="d-grid g8 ai-center grid__1 ws4"></div>');
    const containerHeader = $('<div class="d-flex fd-row jc-space-between"></div>');

    containerHeader.append(textareaLabel);
    containerHeader.append(`<a class="fs-fine" href="/users/current${tabIdentifiers.settings}" target="_blank">Configure default options</a>`);
    container.append(containerHeader);
    container.append(textarea);
    const lengthSpan = $(`<span>${nukePostConfig.detailText.length}</span>`);
    {
        const wrapper = $('<div></div>');
        wrapper.append('<span>Characters: </span>');
        wrapper.append(lengthSpan);
        container.append(wrapper);
    }
    {
        const flagContainer = $('<div class="d-flex fd-row flex__fl-equal g8"></div>');

        const nukeButton = $('<button title="Deletes the post, adds a comment, and logs feedback in Case Manager" class="flex--item h32 s-btn s-btn__danger s-btn__outlined s-btn__xs">Nuke</button>');
        nukeButton.on('click', (ev) => {
            ev.preventDefault();
            void nukePostAsPlagiarism(
                answerId,
                postOwnerId,
                textarea.val() as string,
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
                textarea.prop('disabled', true);
            } else {
                textarea.removeProp('disabled');
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
        textarea.on('input', (ev) => {
            ev.preventDefault();
            const length = (ev.target.value as string).length;
            lengthSpan.text(length);
        });

        flagContainer.append(checkboxContainer);
        flagContainer.append(nukeButton);
        container.append(flagContainer);
    }
    popOver.append(container);
    return $(document.createDocumentFragment()).append(button).append(popOver);
};