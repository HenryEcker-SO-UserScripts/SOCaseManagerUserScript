import {type ActionEvent} from '@hotwired/stimulus';
import {type CmNukePostConfig, nukePostDefaultConfigString, nukePostOptions} from '../../API/gmAPI';
import {isInValidationBounds, validationBounds} from '../../Utils/ValidationHelpers';
import type {FlagPlagiarismResponse} from '../../API/SEAPI';
import {fetchFromAWS} from '../../API/AWSAPI';

function getModalId(postId: number) {
    return NUKE_POST.FORM_MODAL_ID.formatUnicorn({postId: postId});
}

function handleNukePostButtonClick(postId: number, postOwnerId: number) {
    const modalId = getModalId(postId);
    const modal = document.getElementById(modalId);
    if (modal !== null) {
        Stacks.showModal(modal);
    } else {
        $('body')
            .append(
                NUKE_POST.FORM.formatUnicorn({modalId: modalId, postId: postId, postOwnerId: postOwnerId})
            );
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
    Stacks.addController(NUKE_POST.FORM_CONTROLLER, {
        targets: NUKE_POST.DATA_TARGETS,
        get shouldFlag(): boolean {
            return this[NUKE_POST.ENABLE_FLAG_TOGGLE_TARGET].checked as boolean;
        },
        get shouldComment(): boolean {
            return this[NUKE_POST.ENABLE_COMMENT_TOGGLE_TARGET].checked as boolean;
        },
        get shouldLog(): boolean {
            return this[NUKE_POST.ENABLE_LOG_TOGGLE_TARGET].checked as boolean;
        },
        get commentText(): string {
            return this[NUKE_POST.COMMENT_TEXT_TARGET].value ?? '';
        },
        get flagLinkText(): string {
            return this[NUKE_POST.FLAG_LINK_TEXT_TARGET].value ?? '';
        },
        get flagDetailText(): string {
            return this[NUKE_POST.FLAG_DETAIL_TEXT_TARGET].value ?? '';
        },
        connect() {
            const nukePostConfig: CmNukePostConfig = JSON.parse(GM_getValue(nukePostOptions, nukePostDefaultConfigString));

            this[NUKE_POST.ENABLE_FLAG_TOGGLE_TARGET].checked = nukePostConfig.flag;
            this[NUKE_POST.ENABLE_COMMENT_TOGGLE_TARGET].checked = nukePostConfig.comment;
            this[NUKE_POST.ENABLE_LOG_TOGGLE_TARGET].checked = nukePostConfig.log;

            if (!nukePostConfig.flag) {
                $(this[NUKE_POST.FLAG_CONTROL_FIELDS_TARGET]).addClass('d-none');
            }

            if (!nukePostConfig.comment) {
                $(this[NUKE_POST.COMMENT_CONTROL_FIELDS_TARGET]).addClass('d-none');
            }

            this[NUKE_POST.FLAG_DETAIL_TEXT_TARGET].value = nukePostConfig.flagDetailText ?? '';
            this[NUKE_POST.COMMENT_TEXT_TARGET].value = nukePostConfig.commentText ?? '';
        },
        [NUKE_POST.HANDLE_SUBMIT](ev: ActionEvent) {
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
        [NUKE_POST.HANDLE_CANCEL](ev: ActionEvent) {
            ev.preventDefault();
            const {postId} = ev.params;
            const existingModal = document.getElementById(getModalId(postId));
            if (existingModal !== null) {
                existingModal.remove();
            }
        },
        [NUKE_POST.HANDLE_UPDATE_CONTROLLED_FIELD](ev: ActionEvent) {
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

    if (shouldFlagPost) {
        const flagFd = new FormData();
        flagFd.set('fkey', StackExchange.options.user.fkey);
        flagFd.set('otherText', flagDetailText);
        flagFd.set('customData', JSON.stringify({plagiarizedSource: flagLinkText}));
        flagFd.set('overrideWarning', 'false');
        const flagFetch: FlagPlagiarismResponse = await fetch(`/flags/posts/${answerId}/add/PlagiarizedContent`, {
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
    const deleteFetch = await fetch(`/admin/posts/${answerId}/delete-as-plagiarism`, {
        body: deleteFd,
        method: 'POST'
    });

    if (deleteFetch.status !== 200) {
        return; // Deletion failed don't continue
    }

    if (shouldCommentPost) {
        const commentFd = new FormData();
        commentFd.set('fkey', StackExchange.options.user.fkey);
        commentFd.set('comment', commentText);
        await void fetch(`/posts/${answerId}/comments`, {body: commentFd, method: 'POST'});
    }
    if (shouldLogWithAws) {
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