import {type ActionEvent} from '@hotwired/stimulus';
import {type CmNukePostConfig, nukePostDefaultConfigString, nukePostOptions} from '../../API/gmAPI';
import {isInValidationBounds, validationBounds} from '../../Utils/ValidationHelpers';


// Builder Modal
function buildNukePostModal(modalId: string, postId: number, postOwnerId: number) {
    return NUKE_POST_FORM.formatUnicorn({modalId: modalId, postId: postId, postOwnerId: postOwnerId});
}

function getModalId(postId: number) {
    return NUKE_POST_FORM_MODAL_ID.formatUnicorn({postId: postId});
}

function handleNukePostButtonClick(postId: number, postOwnerId: number) {
    const modalId = getModalId(postId);
    const modal: HTMLElement | null | JQuery = document.getElementById(modalId);
    if (modal !== null) {
        Stacks.showModal(modal);
    } else {
        $('body').append(buildNukePostModal(modalId, postId, postOwnerId));
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
    Stacks.addController(NUKE_POST_FORM_CONTROLLER, {
        targets: NUKE_POST_DATA_TARGETS,
        get shouldFlag(): boolean {
            return this[NUKE_POST_ENABLE_FLAG_TOGGLE_TARGET].checked as boolean;
        },
        get shouldComment(): boolean {
            return this[NUKE_POST_ENABLE_COMMENT_TOGGLE_TARGET].checked as boolean;
        },
        get shouldLog(): boolean {
            return this[NUKE_POST_ENABLE_LOG_TOGGLE_TARGET].checked as boolean;
        },
        get commentText(): string {
            return this[NUKE_POST_COMMENT_TEXT_TARGET].value ?? '';
        },
        get flagLinkText(): string {
            return this[NUKE_POST_FLAG_LINK_TEXT_TARGET].value ?? '';
        },
        get flagDetailText(): string {
            return this[NUKE_POST_FLAG_DETAIL_TEXT_TARGET].value ?? '';
        },
        connect() {
            const nukePostConfig: CmNukePostConfig = JSON.parse(GM_getValue(nukePostOptions, nukePostDefaultConfigString));

            if (nukePostConfig.flag) {
                this[NUKE_POST_ENABLE_FLAG_TOGGLE_TARGET].checked = true;
            } else {
                $(this[NUKE_POST_FLAG_CONTROL_FIELDS_TARGET]).addClass('d-none');
            }
            if (nukePostConfig.comment) {
                this[NUKE_POST_ENABLE_COMMENT_TOGGLE_TARGET].checked = true;
            } else {
                $(this[NUKE_POST_COMMENT_CONTROL_FIELDS_TARGET]).addClass('d-none');
            }
            if (nukePostConfig.log) {
                this[NUKE_POST_ENABLE_LOG_TOGGLE_TARGET].checked = true;
            }

            this[NUKE_POST_FLAG_DETAIL_TEXT_TARGET].value = nukePostConfig.flagDetailText ?? '';
            this[NUKE_POST_COMMENT_TEXT_TARGET].value = nukePostConfig.commentText ?? '';
        },
        NUKE_POST_HANDLE_SUBMIT(ev: ActionEvent) {
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
        NUKE_POST_HANDLE_CANCEL(ev: ActionEvent) {
            ev.preventDefault();
            const {postId} = ev.params;
            const existingModal = document.getElementById(getModalId(postId));
            if (existingModal !== null) {
                existingModal.remove();
            }
        },
        NUKE_POST_HANDLE_UPDATE_CONTROLLED_FIELD(ev: ActionEvent) {
            const {controls} = ev.params;
            if ((<HTMLInputElement>ev.target).checked) {
                $(this[`${controls}Target`]).removeClass('d-none');
            } else {
                $(this[`${controls}Target`]).addClass('d-none');
            }
        }
    });
}


async function nukePostAsPlagiarism(
    answerId: number, ownerId: number,
    flagLinkText: string, flagDetailText: string,
    commentText: string,
    shouldFlagPost = false, shouldCommentPost = true, shouldLogWithAws = true
) {
    if (shouldFlagPost && isInValidationBounds(flagLinkText.length, validationBounds.flagLinkTextarea)) {
        StackExchange.helpers.showToast(`Plagiarism flag source must be between ${validationBounds.flagLinkTextarea.min} and ${validationBounds.flagLinkTextarea.max} characters. Either update the text or disable the flagging option.`, {type: 'danger'});
        return;
    }
    if (shouldFlagPost && isInValidationBounds(flagDetailText.length, validationBounds.flagDetailTextarea)) {
        StackExchange.helpers.showToast(`Plagiarism flag detail text must be between ${validationBounds.flagDetailTextarea.min} and ${validationBounds.flagDetailTextarea.max} characters. Either update the text or disable the flagging option.`, {type: 'danger'});
        return;
    }

    if (shouldCommentPost && isInValidationBounds(commentText.length, validationBounds.commentTextarea)) {
        StackExchange.helpers.showToast(`Comments must be between ${validationBounds.commentTextarea.min} and ${validationBounds.commentTextarea.max} characters. Either update the text or disable the comment option.`, {type: 'danger'});
        return;
    }

    console.log({
        answerId,
        ownerId,
        flagLinkText,
        flagDetailText,
        commentText,
        flagPost: shouldFlagPost,
        commentPost: shouldCommentPost,
        logWithAws: shouldLogWithAws
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