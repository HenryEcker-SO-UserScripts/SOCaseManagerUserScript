import {type ActionEvent} from '@hotwired/stimulus';
import {type CmNukePostConfig, nukePostDefaultConfigString, nukePostOptions} from '../../API/gmAPI';


const ids = {
    modal: 'socm-nuke-post-form',
    enableFlagToggle: 'socm-flag-enable-toggle',
    enableCommentToggle: 'socm-comment-enable-toggle',
    enableLogToggle: 'socm-log-nuked-post-toggle',
    flagDetailTextarea: 'socm-nuke-flag-detail-area',
    commentTextarea: 'socm-nuke-comment-area'
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
        flagInfoFields: 'flag-info-area',
        commentInfoFields: 'comment-info-area',
        flagDetailTextarea: 'flag-detail-area',
        commentTextarea: 'comment-area'
    },
    action: {
        handleSubmitActions: 'handleSubmitActions',
        handleCancelActions: 'cancelNuke',
        handleUpdateControlledField: 'handleUpdateControlledField'
    }
};

const validationBounds = {
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

function getNukePostModalId(postId: number): string {
    return `${ids.modal}-${postId}`;
}

// Builder Modal
function buildModal(modalId: string, postId: number, postOwnerId: number) {
    const nukePostConfig: CmNukePostConfig = JSON.parse(GM_getValue(nukePostOptions, nukePostDefaultConfigString));
    // TODO Extract both text areas into helper function they have significant overlap
    // TODO 2 Move the modal--body content into a separate function with configurable controller fields so that the settings page can be build from that
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
                        <label class="s-label" for="${ids.enableFlagToggle}">Flag before deletion:</label>
                        <input class="s-toggle-switch" 
                               id="${ids.enableFlagToggle}"
                               data-${data.controller}-target="${data.target.enableFlagToggle}" 
                               data-${data.controller}-${data.params.controls}-param="${data.target.flagInfoFields}"
                               data-action="change->${data.controller}#${data.action.handleUpdateControlledField}"
                               type="checkbox"${nukePostConfig.flag ? ' checked' : ''}>
                    </div>
                    <div${nukePostConfig.flag ? '' : ' class="d-none"'} data-${data.controller}-target="${data.target.flagInfoFields}">
                        <div class="d-flex ff-column-nowrap gs4 gsy" 
                             data-controller="se-char-counter" 
                             data-se-char-counter-min="${validationBounds.flagDetailTextarea.min}" 
                             data-se-char-counter-max="${validationBounds.flagDetailTextarea.max}">
                            <label class="s-label flex--item" for="${ids.flagDetailTextarea}">Flag Detail Text:</label>
                            <textarea style="font-family:monospace"
                                      class="flex--item s-textarea" 
                                      data-se-char-counter-target="field" 
                                      data-is-valid-length="false" 
                                      id="${ids.flagDetailTextarea}" 
                                      name="flag detail text" 
                                      rows="5" 
                                      data-${data.controller}-target="${data.target.flagDetailTextarea}">${nukePostConfig.flagDetailText}</textarea>
                            <div data-se-char-counter-target="output"></div>
                        </div>
                    </div>
                </div>
                <div>
                    <div class="d-flex ai-center g8">
                        <label class="s-label" for="${ids.enableCommentToggle}">Comment after deletion:</label>
                        <input class="s-toggle-switch" 
                              id="${ids.enableCommentToggle}" 
                              data-${data.controller}-target="${data.target.enableCommentToggle}" 
                              data-${data.controller}-${data.params.controls}-param="${data.target.commentInfoFields}"
                              data-action="change->${data.controller}#${data.action.handleUpdateControlledField}"
                              type="checkbox"${nukePostConfig.comment ? ' checked' : ''}>
                    </div>
                    <div${nukePostConfig.comment ? '' : ' class="d-none"'} data-${data.controller}-target="${data.target.commentInfoFields}">
                        <div class="d-flex ff-column-nowrap gs4 gsy" 
                             data-controller="se-char-counter" 
                             data-se-char-counter-min="${validationBounds.commentTextarea.min}" 
                             data-se-char-counter-max="${validationBounds.commentTextarea.max}"
                             data-${data.controller}-target="${data.target.commentInfoFields}">
                            <label class="s-label flex--item" for="${ids.commentTextarea}">Comment Text:</label>
                            <textarea style="font-family:monospace" 
                                      class="flex--item s-textarea" 
                                      data-se-char-counter-target="field" 
                                      data-is-valid-length="false" 
                                      id="${ids.commentTextarea}"
                                      name="comment text" 
                                      rows="5" 
                                      data-${data.controller}-target="${data.target.commentTextarea}">${nukePostConfig.commentText}</textarea>
                            <div data-se-char-counter-target="output"></div>
                        </div>
                    </div>
                </div>
                <div class="d-flex ai-center g8">
                    <label class="s-label" for="${ids.enableLogToggle}">Log post in Case Manager:</label>
                    <input class="s-toggle-switch" 
                           id="${ids.enableLogToggle}"
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
    const modalId = getNukePostModalId(postId);
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
            return (this[`${data.target.commentTextarea}Target`] as unknown as HTMLTextAreaElement).value;
        },
        get flagDetailText(): string {
            return (this[`${data.target.flagDetailTextarea}Target`] as unknown as HTMLTextAreaElement).value;
        },
        [data.action.handleSubmitActions](ev: ActionEvent) {
            ev.preventDefault();
            const {postOwner, postId} = ev.params;
            void nukePostAsPlagiarism(
                postId,
                postOwner,
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
            const existingModal = document.getElementById(getNukePostModalId(postId));
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

async function nukePostAsPlagiarism(answerId: number, ownerId: number, flagText: string, commentText: string,
                                    flagPost = false, commentPost = true, logWithAws = true) {
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
        flagText,
        commentText,
        flagPost,
        commentPost,
        logWithAws
    });
    //
    //
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
    //
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