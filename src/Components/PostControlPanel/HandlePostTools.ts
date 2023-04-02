import {type ActionEvent} from '@hotwired/stimulus';
import {addComment} from 'se-ts-userscript-utilities/Comments/Comments';
import {flagPlagiarizedContent} from 'se-ts-userscript-utilities/FlaggingAndVoting/PostFlags';
import {deleteAsPlagiarism} from 'se-ts-userscript-utilities/Moderators/HandleFlags';
import {removeModalFromDOM} from 'se-ts-userscript-utilities/StacksHelpers/StacksModal';
import {
    assertValidCommentTextLength,
    assertValidPlagiarismFlagTextLengths,
    plagiarismFlagLengthBounds,
    commentTextLengthBounds
} from 'se-ts-userscript-utilities/Validators/TextLengthValidators';
import {fetchFromAWS} from '../../API/AWSAPI';
import {type CmNukePostConfig, nukePostDefaultConfigString, nukePostOptions} from '../../API/gmAPI';
import {getMessageFromCaughtElement} from '../../Utils/ErrorHandlingHelpers';
import {configureCharCounter} from '../../Utils/StacksCharCounter';

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
                configureCharCounter(
                    $(this[HANDLE_POST.FLAG_DETAIL_TEXT_TARGET]),
                    nukePostConfig.flagDetailText ?? '',
                    plagiarismFlagLengthBounds.explanation
                );

                configureCharCounter(
                    $(this[HANDLE_POST.COMMENT_TEXT_TARGET]),
                    nukePostConfig.commentText ?? '',
                    commentTextLengthBounds
                );
            },
            async [HANDLE_POST.HANDLE_NUKE_SUBMIT](ev: ActionEvent) {
                await submitHandlerTemplate(
                    ev,
                    $(this[HANDLE_POST.SUBMIT_BUTTON_TARGET]),
                    async (postOwner: number, postId: number) => {
                        await handlePlagiarisedPost(
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
                        window.location.reload();
                    });
            },
            [HANDLE_POST.HANDLE_CANCEL](ev: ActionEvent) {
                ev.preventDefault();
                const {postId} = ev.params;
                removeModalFromDOM(getModalId(postId));
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
                configureCharCounter(
                    $(this[HANDLE_POST.FLAG_DETAIL_TEXT_TARGET]),
                    '',
                    plagiarismFlagLengthBounds.explanation
                );
                this[HANDLE_POST.ENABLE_LOG_TOGGLE_TARGET].checked = true;
            },
            async [HANDLE_POST.HANDLE_FLAG_SUBMIT](ev: ActionEvent) {
                await submitHandlerTemplate(
                    ev,
                    $(this[HANDLE_POST.SUBMIT_BUTTON_TARGET]),
                    async (postOwner: number, postId: number) => {
                        const resolveMessage = await handlePlagiarisedPost(
                            postId,
                            postOwner,
                            this.flagOriginalSourceText,
                            this.flagDetailText,
                            '',
                            true,
                            false,
                            false,
                            this.shouldLog,
                        );

                        removeModalFromDOM(getModalId(postId));
                        if (resolveMessage !== undefined) {
                            StackExchange.helpers.showToast(resolveMessage);
                        }
                    }
                );
            },
            [HANDLE_POST.HANDLE_CANCEL](ev: ActionEvent) {
                ev.preventDefault();
                const {postId} = ev.params;
                removeModalFromDOM(getModalId(postId));
            }
        }
    );
}


async function submitHandlerTemplate(ev: ActionEvent, jSubmitButton: JQuery, uniqueHandleActions: (postOwner: number, postId: number) => Promise<void>) {
    ev.preventDefault();
    jSubmitButton
        .prop('disabled', true)
        .addClass('is-loading');
    const {postOwner, postId} = ev.params;
    try {
        await uniqueHandleActions(postOwner, postId);
    } catch (error) {
        StackExchange.helpers.showToast(getMessageFromCaughtElement(error), {type: 'danger'});
        jSubmitButton
            .prop('disabled', false)
            .removeClass('is-loading');
    }
}


async function handlePlagiarisedPost(
    answerId: number, ownerId: number,
    flagOriginalSourceText: string, flagDetailText: string,
    commentText: string,
    shouldFlagPost: boolean, shouldDeletePost: boolean, shouldCommentPost: boolean, shouldLogWithAws: boolean
) {
    if (shouldFlagPost) {
        assertValidPlagiarismFlagTextLengths(flagOriginalSourceText.length, flagDetailText.length);
    }

    if (shouldCommentPost) {
        assertValidCommentTextLength(commentText.length);
    }

    let resolveMessage: undefined | string = undefined;

    if (shouldFlagPost) {
        const flagFetch = await flagPlagiarizedContent(answerId, flagOriginalSourceText, flagDetailText);
        if (!flagFetch.Success) {
            throw new Error(flagFetch.Message); // don't continue
        }
        // If post isn't going to be deleted show the "Thanks for flagging" toast
        // Save message for later (it's confusing when the message shows up well before logging with AWS finishes)
        if (!shouldDeletePost) {
            resolveMessage = flagFetch.Message;
        }
    }

    if (shouldDeletePost) {
        const deleteFetch = await deleteAsPlagiarism(answerId);
        if (deleteFetch.status !== 200) {
            throw new Error('Something went wrong when deleting "as plagiarism"!'); // Deletion failed don't continue
        }
    }

    if (shouldCommentPost) {
        await void addComment(answerId, commentText);
    }

    if (shouldLogWithAws) {
        const body: {
            postOwnerId?: number;
            feedbackIds?: number[];
        } = {};
        if (ownerId !== -1) {
            body['postOwnerId'] = ownerId;
        }

        const feedbacks = [FeedbackIds.Plagiarised];
        if (shouldDeletePost) {
            feedbacks.push(FeedbackIds.Deleted);
        }
        body['feedbackIds'] = feedbacks;
        await void fetchFromAWS(`/handle/post/${answerId}`, {
            'method': 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });
    }
    return resolveMessage;
}