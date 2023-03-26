import {type ActionEvent} from '@hotwired/stimulus';
import {addComment} from 'se-ts-userscript-utilities/Comments/Comments';
import {flagPlagiarizedContent} from 'se-ts-userscript-utilities/FlaggingAndVoting/PostFlags';
import {deleteAsPlagiarism} from 'se-ts-userscript-utilities/Moderators/HandleFlags';
import {fetchFromAWS} from '../../API/AWSAPI';
import {type CmNukePostConfig, nukePostDefaultConfigString, nukePostOptions} from '../../API/gmAPI';
import {isInValidationBounds, validationBounds} from '../../Utils/ValidationHelpers';

function getModalId(postId: number) {
    return HANDLE_POST.FORM_MODAL_ID.formatUnicorn({postId: postId});
}

function handleHandlePostButtonClick(isModerator: boolean, postId: number, postOwnerId: number) {
    const modalId = getModalId(postId);
    const modal = document.getElementById(modalId);
    if (modal !== null) {
        Stacks.showModal(modal);

    } else {
        $('body')
            .append(
                (isModerator ? HANDLE_POST.MOD_FORM : HANDLE_POST.NON_MOD_FORM).formatUnicorn({
                    modalId: modalId,
                    postId: postId,
                    postOwnerId: postOwnerId
                })
            );

        setTimeout(() => {
            // Should be guaranteed to not be null since it was just added above
            Stacks.showModal(<HTMLElement>document.getElementById(modalId));
        }, 50);
    }
}

export function buildHandlePostButton(isModerator: boolean, isDeleted: boolean, answerId: number, postOwnerId: number) {
    const button = $(`<button ${isDeleted ? 'disabled' : ''}  class="ml-auto s-btn s-btn__danger s-btn__outlined" type="button">${isModerator ? 'Nuke' : 'Flag'} as plagiarism</button>`);
    button.on('click', () => {
        handleHandlePostButtonClick(isModerator, answerId, postOwnerId);
    });
    return button;
}

export function registerModHandlePostStacksController() {
    Stacks.addController(HANDLE_POST.FORM_CONTROLLER,
        {
            targets: HANDLE_POST.MOD_DATA_TARGETS,
            get shouldFlag(): boolean {
                return this[HANDLE_POST.ENABLE_FLAG_TOGGLE_TARGET].checked as boolean;
            },
            get shouldComment(): boolean {
                return this[HANDLE_POST.ENABLE_COMMENT_TOGGLE_TARGET].checked as boolean;
            },
            get shouldLog(): boolean {
                return this[HANDLE_POST.ENABLE_LOG_TOGGLE_TARGET].checked as boolean;
            },
            get commentText(): string {
                return this[HANDLE_POST.COMMENT_TEXT_TARGET].value ?? '';
            },
            get flagOriginalSourceText(): string {
                return this[HANDLE_POST.FLAG_ORIGINAL_SOURCE_TEXT_TARGET].value ?? '';
            },
            get flagDetailText(): string {
                return this[HANDLE_POST.FLAG_DETAIL_TEXT_TARGET].value ?? '';
            },
            connect() {
                const nukePostConfig: CmNukePostConfig = JSON.parse(GM_getValue(nukePostOptions, nukePostDefaultConfigString));

                this[HANDLE_POST.ENABLE_FLAG_TOGGLE_TARGET].checked = nukePostConfig.flag;
                this[HANDLE_POST.ENABLE_COMMENT_TOGGLE_TARGET].checked = nukePostConfig.comment;
                this[HANDLE_POST.ENABLE_LOG_TOGGLE_TARGET].checked = nukePostConfig.log;

                if (!nukePostConfig.flag) {
                    $(this[HANDLE_POST.FLAG_CONTROL_FIELDS_TARGET]).addClass('d-none');
                }

                if (!nukePostConfig.comment) {
                    $(this[HANDLE_POST.COMMENT_CONTROL_FIELDS_TARGET]).addClass('d-none');
                }

                this[HANDLE_POST.FLAG_DETAIL_TEXT_TARGET].value = nukePostConfig.flagDetailText ?? '';
                this[HANDLE_POST.COMMENT_TEXT_TARGET].value = nukePostConfig.commentText ?? '';
            },
            [HANDLE_POST.HANDLE_NUKE_SUBMIT](ev: ActionEvent) {
                ev.preventDefault();
                const {postOwner, postId} = ev.params;
                void handlePlagiarisedPost(
                    postId,
                    postOwner,
                    this.flagOriginalSourceText,
                    this.flagDetailText,
                    this.commentText,
                    this.shouldFlag,
                    true,
                    this.shouldComment,
                    this.shouldLog
                );
            },
            [HANDLE_POST.HANDLE_FLAG_SUBMIT](ev: ActionEvent) {
                ev.preventDefault();
                const {postOwner, postId} = ev.params;
                void handlePlagiarisedPost(
                    postId,
                    postOwner,
                    this.flagOriginalSourceText,
                    this.flagDetailText,
                    '',
                    true,
                    false,
                    false,
                    this.shouldLog
                );
            },
            [HANDLE_POST.HANDLE_CANCEL](ev: ActionEvent) {
                ev.preventDefault();
                const {postId} = ev.params;
                const existingModal = document.getElementById(getModalId(postId));
                if (existingModal !== null) {
                    existingModal.remove();
                }
            },
            [HANDLE_POST.HANDLE_UPDATE_CONTROLLED_FIELD](ev: ActionEvent) {
                const {controls} = ev.params;
                if ((<HTMLInputElement>ev.target).checked) {
                    $(this[`${controls}Target`]).removeClass('d-none');
                } else {
                    $(this[`${controls}Target`]).addClass('d-none');
                }
            }
        }
    );
}

// Controller Logic
export function registerNonModHandlePostStacksController() {
    Stacks.addController(HANDLE_POST.FORM_CONTROLLER,
        {
            targets: HANDLE_POST.NON_MOD_DATA_TARGETS,
            get shouldLog(): boolean {
                return this[HANDLE_POST.ENABLE_LOG_TOGGLE_TARGET].checked as boolean;
            },
            get flagOriginalSourceText(): string {
                return this[HANDLE_POST.FLAG_ORIGINAL_SOURCE_TEXT_TARGET].value ?? '';
            },
            get flagDetailText(): string {
                return this[HANDLE_POST.FLAG_DETAIL_TEXT_TARGET].value ?? '';
            },
            connect() {
                this[HANDLE_POST.ENABLE_LOG_TOGGLE_TARGET].checked = true;
            },
            [HANDLE_POST.HANDLE_FLAG_SUBMIT](ev: ActionEvent) {
                ev.preventDefault();
                const {postOwner, postId} = ev.params;
                void handlePlagiarisedPost(
                    postId,
                    postOwner,
                    this.flagOriginalSourceText,
                    this.flagDetailText,
                    '',
                    true,
                    false,
                    false,
                    this.shouldLog
                );
            },
            [HANDLE_POST.HANDLE_CANCEL](ev: ActionEvent) {
                ev.preventDefault();
                const {postId} = ev.params;
                const existingModal = document.getElementById(getModalId(postId));
                if (existingModal !== null) {
                    existingModal.remove();
                }
            }
        }
    );
}


async function handlePlagiarisedPost(
    answerId: number, ownerId: number,
    flagOriginalSourceText: string, flagDetailText: string,
    commentText: string,
    shouldFlagPost: boolean, shouldDeletePost: boolean, shouldCommentPost: boolean, shouldLogWithAws: boolean
) {
    if (shouldFlagPost && !isInValidationBounds(flagOriginalSourceText.length, validationBounds.flagOriginalSourceTextarea)) {
        StackExchange.helpers.showToast(`Plagiarism flag source must be more than ${validationBounds.flagOriginalSourceTextarea.min} characters. Either update the text or disable the flagging option.`, {type: 'danger'});
        return;
    }
    if (shouldFlagPost && !isInValidationBounds(flagDetailText.length, validationBounds.flagDetailTextarea)) {
        StackExchange.helpers.showToast(`Plagiarism flag detail text must be between ${validationBounds.flagDetailTextarea.min} and ${validationBounds.flagDetailTextarea.max} characters. Either update the text or disable the flagging option.`, {type: 'danger'});
        return;
    }

    if (shouldCommentPost && !isInValidationBounds(commentText.length, validationBounds.commentTextarea)) {
        StackExchange.helpers.showToast(`Comments must be between ${validationBounds.commentTextarea.min} and ${validationBounds.commentTextarea.max} characters. Either update the text or disable the comment option.`, {type: 'danger'});
        return;
    }

    if (shouldFlagPost) {
        const flagFetch = await flagPlagiarizedContent(answerId, flagOriginalSourceText, flagDetailText);
        if (!flagFetch.Success) {
            StackExchange.helpers.showToast(flagFetch.Message);
            return; // don't continue
        }
    }

    if (shouldDeletePost) {
        const deleteFetch = await deleteAsPlagiarism(answerId);
        if (deleteFetch.status !== 200) {
            return; // Deletion failed don't continue
        }
    }

    if (shouldCommentPost) {
        await void addComment(answerId, commentText);
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
    if (shouldDeletePost) {
        window.location.reload();
    }
}