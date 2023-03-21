import {type ActionEvent} from '@hotwired/stimulus';
import {type CmNukePostConfig, nukePostDefaultConfigString, nukePostOptions} from '../../API/gmAPI';


const ids = {
    modal(postId: number) {
        return `socm-nuke-post-form-${postId}`;
    },
    enableFlagToggle(postId: number) {
        return `socm-flag-enable-toggle-${postId}`;
    },
    enableCommentToggle(postId: number) {
        return `socm-comment-enable-toggle-${postId}`;
    },
    enableLogToggle(postId: number) {
        return `socm-log-nuked-post-toggle-${postId}`;
    },
    flagLinkTextarea(postId: number) {
        return `socm-nuke-flag-link-area-${postId}`;
    },
    flagDetailTextarea(postId: number) {
        return `socm-nuke-flag-detail-area-${postId}`;
    },
    commentTextarea(postId: number) {
        return `socm-nuke-comment-area-${postId}`;
    }
};

const data = {
    controller: 'socm-nuke-post-form',
    params: {
        postId: 'post-id',
        postOwner: 'post-owner',
        controls: 'controls'
    },
    target: {
        nukePostButton: 'nuke-post-button',
        cancelButton: 'cancel-button',
        enableFlagToggle: 'flag-enable-toggle',
        enableCommentToggle: 'comment-enable-toggle',
        enableLogToggle: 'log-enable-toggle',
        flagControlFields: 'flag-info-area',
        commentControlFields: 'comment-info-area',
        flagLinkTextarea: 'flag-link-area',
        flagDetailTextarea: 'flag-detail-area',
        commentTextarea: 'comment-area'
    },
    action: {
        handleSubmitActions: 'handleSubmitActions',
        handleCancelActions: 'cancelNuke',
        handleUpdateControlledField: 'handleUpdateControlledField'
    }
};

interface ValidationBounds {
    min: number;
    max: number;
}

const validationBounds: Record<string, ValidationBounds> = {
    flagDetailTextarea: {
        min: 10,
        max: 500
    },
    flagLinkTextarea: {
        min: 10,
        max: 200
    },
    commentTextarea: {
        min: 15,
        max: 600
    }
};

function buildTextarea(
    textareaId: string | number, textareaName: string, textareaText: string, rows: string | number, dataTarget: string,
    labelText: string,
    vB: ValidationBounds
) {
    return `
<div class="d-flex ff-column-nowrap gs4 gsy" 
     data-controller="se-char-counter"
     data-se-char-counter-min="${vB.min}"
     data-se-char-counter-max="${vB.max}">
     <label class="s-label flex--item" for="${textareaId}">${labelText}</label>
     <textarea style="font-family:monospace"
               class="flex--item s-textarea" 
               data-se-char-counter-target="field" 
               data-is-valid-length="false" 
               id="${textareaId}" 
               name="${textareaName}" 
               rows="${rows}" 
               data-${data.controller}-target="${dataTarget}">${textareaText}</textarea>
     <div data-se-char-counter-target="output"></div>
</div>`;
}

// Builder Modal
function buildModal(modalId: string, postId: number, postOwnerId: number) {
    const nukePostConfig: CmNukePostConfig = JSON.parse(GM_getValue(nukePostOptions, nukePostDefaultConfigString));
    // TODO Move the modal--body content into a separate function with configurable controller fields so that the settings page can be build from that
    // TODO Move toggle labels into helper function
    return `
<aside class="s-modal s-modal__danger" id="${modalId}" tabindex="-1" role="dialog" aria-hidden="false" data-controller="s-modal" data-s-modal-target="modal">
    <div class="s-modal--dialog" style="min-width:45vw; width: max-content; max-width: 65vw;" 
         role="document" 
         data-controller="${data.controller}">
        <h1 class="s-modal--header">Nuke Plagiarism</h1>
        <div class="s-modal--body">
            <div class="d-flex fd-column g8">
                <div>
                    <div class="d-flex ai-center g8">
                        <label class="s-label" for="${ids.enableFlagToggle(postId)}">Flag before deletion:</label>
                        <input class="s-toggle-switch" 
                               id="${ids.enableFlagToggle(postId)}"
                               data-${data.controller}-target="${data.target.enableFlagToggle}" 
                               data-${data.controller}-${data.params.controls}-param="${data.target.flagControlFields}"
                               data-action="change->${data.controller}#${data.action.handleUpdateControlledField}"
                               type="checkbox"${nukePostConfig.flag ? ' checked' : ''}>
                    </div>
                    <div${nukePostConfig.flag ? '' : ' class="d-none"'} data-${data.controller}-target="${data.target.flagControlFields}">${
        buildTextarea(
            `${ids.flagLinkTextarea(postId)}`,
            'flag link text',
            '',
            2,
            data.target.flagLinkTextarea,
            'Link to source:',
            validationBounds.flagLinkTextarea)}
       ${buildTextarea(
        `${ids.flagDetailTextarea(postId)}`,
        'flag detail text',
        nukePostConfig.flagDetailText ?? '',
        5,
        data.target.flagDetailTextarea,
        'Flag Detail Text:',
        validationBounds.flagDetailTextarea)}
                    </div>
                </div>
                <div>
                    <div class="d-flex ai-center g8">
                        <label class="s-label" for="${ids.enableCommentToggle(postId)}">Comment after deletion:</label>
                        <input class="s-toggle-switch" 
                              id="${ids.enableCommentToggle(postId)}" 
                              data-${data.controller}-target="${data.target.enableCommentToggle}" 
                              data-${data.controller}-${data.params.controls}-param="${data.target.commentControlFields}"
                              data-action="change->${data.controller}#${data.action.handleUpdateControlledField}"
                              type="checkbox"${nukePostConfig.comment ? ' checked' : ''}>
                    </div>
                    <div${nukePostConfig.comment ? '' : ' class="d-none"'} data-${data.controller}-target="${data.target.commentControlFields}">${
        buildTextarea(
            `${ids.commentTextarea(postId)}`,
            'comment text',
            nukePostConfig.commentText ?? '',
            5,
            data.target.commentTextarea,
            'Comment Text:',
            validationBounds.commentTextarea)}
                    </div>
                </div>
                <div class="d-flex ai-center g8">
                    <label class="s-label" for="${ids.enableLogToggle(postId)}">Log post in Case Manager:</label>
                    <input class="s-toggle-switch" 
                           id="${ids.enableLogToggle(postId)}"
                           data-${data.controller}-target="${data.target.enableLogToggle}" 
                           type="checkbox"${nukePostConfig.log ? ' checked' : ''}>
                </div>
            </div>
        </div>
        <div class="d-flex gx8 s-modal--footer ai-center">
            <button class="s-btn flex--item s-btn__filled s-btn__danger" 
                    type="button" 
                    data-${data.controller}-target="${data.target.nukePostButton}" 
                    data-action="click->${data.controller}#${data.action.handleSubmitActions}" 
                    data-${data.controller}-${data.params.postId}-param="${postId}" 
                    data-${data.controller}-${data.params.postOwner}-param="${postOwnerId}">Nuke Post</button>
            <button class="s-btn flex--item s-btn__muted" 
                    type="button" 
                    data-action="click->${data.controller}#${data.action.handleCancelActions}"
                    data-${data.controller}-${data.params.postId}-param="${postId}" >Cancel</button>
            <a class="fs-fine ml-auto" href="/users/current?tab=case-manager-settings" target="_blank">Configure default options</a>
        </div>
        <button class="s-modal--close s-btn s-btn__muted" type="button" aria-label="Close" data-action="s-modal#hide"><svg aria-hidden="true" class="svg-icon iconClearSm" width="14" height="14" viewBox="0 0 14 14"><path d="M12 3.41 10.59 2 7 5.59 3.41 2 2 3.41 5.59 7 2 10.59 3.41 12 7 8.41 10.59 12 12 10.59 8.41 7 12 3.41Z"></path></svg></button>
    </div>
</aside>`;
}

function handleNukePostButtonClick(postId: number, postOwnerId: number) {
    const modalId = ids.modal(postId);
    const modal: HTMLElement | null | JQuery = document.getElementById(modalId);
    if (modal !== null) {
        Stacks.showModal(modal);
    } else {
        $('body').append(buildModal(modalId, postId, postOwnerId));
    }
}


export function buildNukePostButton(isDeleted: boolean, answerId: number, postOwnerId: number) {
    const button = $(`<button ${isDeleted ? 'disabled' : ''}  class="ml-auto s-btn s-btn__danger s-btn__outlined" type="button">Nuke as plagiarism</button>`);
    button.on('click', () => {
        handleNukePostButtonClick(answerId, postOwnerId);
    });
    return button;
}


// Controller Logic
export function registerNukePostStacksController() {
    const controllerConfig = {
        targets: [...Object.values(data.target)],
        get shouldFlag(): boolean {
            return (this[`${data.target.enableFlagToggle}Target`] as unknown as HTMLInputElement).checked as boolean;
        },
        get shouldComment(): boolean {
            return (this[`${data.target.enableCommentToggle}Target`] as unknown as HTMLInputElement).checked as boolean;
        },
        get shouldLog(): boolean {
            return (this[`${data.target.enableLogToggle}Target`] as unknown as HTMLInputElement).checked;
        },
        get commentText(): string {
            return (this[`${data.target.commentTextarea}Target`] as unknown as HTMLTextAreaElement).value ?? '';
        },
        get flagLinkText(): string {
            return (this[`${data.target.flagLinkTextarea}Target`] as unknown as HTMLTextAreaElement).value ?? '';
        },
        get flagDetailText(): string {
            return (this[`${data.target.flagDetailTextarea}Target`] as unknown as HTMLTextAreaElement).value ?? '';
        },
        [data.action.handleSubmitActions](ev: ActionEvent) {
            ev.preventDefault();
            const {postOwner, postId} = ev.params;
            void nukePostAsPlagiarism(
                postId,
                postOwner,
                this.flagLinkText,
                this.flagDetailText,
                this.commentText,
                this.shouldFlag,
                this.shouldComment,
                this.shouldLog
            );
        },
        [data.action.handleCancelActions](ev: ActionEvent) {
            ev.preventDefault();
            const {postId} = ev.params;
            const existingModal = document.getElementById(ids.modal(postId));
            if (existingModal !== null) {
                existingModal.remove();
            }
        },
        [data.action.handleUpdateControlledField](ev: ActionEvent) {
            const {controls} = ev.params;
            if ((<HTMLInputElement>ev.target).checked) {
                $(this[`${controls}Target`] as unknown as HTMLElement).removeClass('d-none');
            } else {
                $(this[`${controls}Target`] as unknown as HTMLElement).addClass('d-none');

            }
        }
    };
    Stacks.addController(data.controller, controllerConfig);
}

async function nukePostAsPlagiarism(answerId: number, ownerId: number,
                                    flagLinkText: string, flagText: string,
                                    commentText: string,
                                    flagPost = false, commentPost = true, logWithAws = true) {
    if (flagPost && (flagLinkText.length < validationBounds.flagLinkTextarea.min || flagLinkText.length > validationBounds.flagLinkTextarea.max)) {
        StackExchange.helpers.showToast(`Flags must be between ${validationBounds.flagLinkTextarea.min} and ${validationBounds.flagLinkTextarea.max} characters. Either add text or disable the flagging option.`, {type: 'danger'});
        return;
    }
    if (flagPost && (flagText.length < validationBounds.flagDetailTextarea.min || flagText.length > validationBounds.flagDetailTextarea.max)) {
        StackExchange.helpers.showToast(`Flags must be between ${validationBounds.flagDetailTextarea.min} and ${validationBounds.flagDetailTextarea.max} characters. Either add text or disable the flagging option.`, {type: 'danger'});
        return;
    }
    if (commentPost && (commentText.length < validationBounds.commentTextarea.min || commentText.length > validationBounds.commentTextarea.max)) {
        StackExchange.helpers.showToast(`Comments must be between ${validationBounds.commentTextarea.min} and ${validationBounds.commentTextarea.max} characters. Either add text or disable the comment option.`, {type: 'danger'});
        return;
    }

    console.log({
        answerId,
        ownerId,
        flagLinkText,
        flagText,
        commentText,
        flagPost,
        commentPost,
        logWithAws
    });
    //
    // TODO Update new flag type and fields
    // if (flagPost) {
    //     const flagFd = new FormData();
    //     flagFd.set('fkey', StackExchange.options.user.fkey);
    //     flagFd.set('otherText', flagText);
    //     const flagFetch: FlagOtherResponse = await fetch(`/flags/posts/${answerId}/add/PostOther`, {
    //         body: flagFd,
    //         method: 'POST'
    //     }).then(res => res.json());
    //     if (!flagFetch.Success) {
    //         StackExchange.helpers.showToast(flagFetch.Message);
    //         return; // don't continue
    //     }
    // }
    // TODO This will need re-written "Delete as plagiarism" is a different delete type!!
    // const deleteFd = new FormData();
    // deleteFd.set('fkey', StackExchange.options.user.fkey);
    // const deleteFetch: PostDeleteResponse = await fetch(`/posts/${answerId}/vote/10`, {
    //     body: deleteFd,
    //     method: 'POST'
    // }).then(res => res.json());
    //
    // if (!deleteFetch.Success) {
    //     return; // Deletion failed don't continue
    // }
    // if (commentPost) {
    //     const commentFd = new FormData();
    //     commentFd.set('fkey', StackExchange.options.user.fkey);
    //     commentFd.set('comment', commentText);
    //     await void fetch(`/posts/${answerId}/comments`, {body: commentFd, method: 'POST'});
    // }
    // if (logWithAws) {
    //     const body: {
    //         postOwnerId?: number;
    //         actionIds?: number[];
    //     } = {};
    //     if (ownerId !== -1) {
    //         body['postOwnerId'] = ownerId;
    //     }
    //     body['actionIds'] = [Feedback.Plagiarised, Feedback.Deleted];
    //     void await fetchFromAWS(`/handle/post/${answerId}`, {
    //         'method': 'POST',
    //         headers: {
    //             'Content-Type': 'application/json',
    //         },
    //         body: JSON.stringify(body)
    //     });
    // }
    // window.location.reload();
}