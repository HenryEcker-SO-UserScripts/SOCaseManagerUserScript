// ==UserScript==
// @name        SO Plagiarism Case Manager
// @description Help facilitate and track collaborative plagiarism cleanup efforts
// @homepage    https://github.com/HenryEcker/SOCaseManagerUserScript
// @author      Henry Ecker (https://github.com/HenryEcker)
// @version     0.5.0
// @downloadURL https://github.com/HenryEcker/SOCaseManagerUserScript/raw/master/dist/SOCaseManager.user.js
// @updateURL   https://github.com/HenryEcker/SOCaseManagerUserScript/raw/master/dist/SOCaseManager.user.js
// @match       *://stackoverflow.com/questions/*
// @match       *://stackoverflow.com/users
// @match       *://stackoverflow.com/users?*
// @match       *://stackoverflow.com/users/*
// @exclude     *://stackoverflow.com/users/apps/*
// @exclude     *://stackoverflow.com/users/delete/*
// @exclude     *://stackoverflow.com/users/edit/*
// @exclude     *://stackoverflow.com/users/email/*
// @exclude     *://stackoverflow.com/users/hidecommunities/*
// @exclude     *://stackoverflow.com/users/message/*
// @exclude     *://stackoverflow.com/users/my-collectives/*
// @exclude     *://stackoverflow.com/users/mylogins/*
// @exclude     *://stackoverflow.com/users/preferences/*
// @exclude     *://stackoverflow.com/users/saves/*
// @exclude     *://stackoverflow.com/users/tag-notifications/*
// @exclude     *://stackoverflow.com/users/teams/*
// @grant       GM_deleteValue
// @grant       GM_getValue
// @grant       GM_setValue
// ==/UserScript==
/* globals $, StackExchange */

(function() {
    "use strict";
    const accessToken = "access_token";
    const seApiToken = "se_api_token";
    const nukePostDefaultConfigString = JSON.stringify({
        flagDetailText: "",
        commentText: "",
        flag: false,
        comment: false,
        log: true
    });
    const nukePostOptions = "cm_nuke_post_config";
    function requestNewJwt() {
        return fetchFromAWS("/auth/cm/jwt", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                se_api_token: GM_getValue(seApiToken)
            })
        }, false).then((res => res.json())).then((resData => {
            GM_setValue(accessToken, resData.cm_access_token);
        })).catch((err => {
            GM_deleteValue(accessToken);
            console.error(err);
        }));
    }
    function fetchFromAWS(path, options, withCredentials = true) {
        let newOptions = withCredentials ? {
            headers: {
                access_token: GM_getValue(accessToken)
            }
        } : {};
        if (void 0 !== options) {
            newOptions = {
                ...options,
                headers: {
                    ...options.headers,
                    ...newOptions.headers
                }
            };
        }
        return fetch(`https://4shuk8vsp8.execute-api.us-east-1.amazonaws.com/prod${path}`, newOptions).then((res => {
            if (401 === res.status) {
                return requestNewJwt().then((() => fetchFromAWS(path, options)));
            }
            return res;
        }));
    }
    function getSummaryPostInfoFromIds(ids) {
        if (ids.length <= 0) {
            return Promise.resolve(new Set);
        }
        return fetchFromAWS(`/summary/posts/${ids.join(";")}`).then((res => res.json())).then((postIds => Promise.resolve(new Set(postIds))));
    }
    function getSummaryPostActionsFromIds(ids) {
        if (ids.length <= 0) {
            return Promise.resolve({});
        }
        return fetchFromAWS(`/summary/posts/${ids.join(";")}/actions`).then((res => res.json())).then((postActionData => Promise.resolve(postActionData)));
    }
    const seTokenAuthRoute = "https://stackoverflow.com/oauth?client_id=24380&scope=no_expiry&redirect_uri=https://4shuk8vsp8.execute-api.us-east-1.amazonaws.com/prod/auth/se/oauth";
    function buildClientSideAuthModal() {
        const authModalId = "case-manager-client-auth-modal";
        $("body").append($(`<aside class="s-modal" id="${authModalId}" role="dialog" aria-labelledby="${authModalId}-modal-title" aria-describedby="${authModalId}-modal-description" aria-hidden="false" data-controller="s-modal" data-s-modal-target="modal"></aside>`).append(buildModal(authModalId)));
    }
    function buildModal(authModalId) {
        return $('<div class="s-modal--dialog" role="document"></div>').append($(`<h1 class="s-modal--header" id="${authModalId}-modal-title">Authorise Case Manager</h1>`)).append($(`<p class="s-modal--body" id="${authModalId}-modal-description">The Case Manager requires API access validate your user account.</p>`)).append(buildOrderedListOfInstructions(authModalId)).append(buildFormControlButtons(authModalId)).append('<button class="s-modal--close s-btn s-btn__muted" aria-label="Close" data-action="s-modal#hide"><svg aria-hidden="true" class="svg-icon iconClearSm" width="14" height="14" viewBox="0 0 14 14"><path d="M12 3.41 10.59 2 7 5.59 3.41 2 2 3.41 5.59 7 2 10.59 3.41 12 7 8.41 10.59 12 12 10.59 8.41 7 12 3.41Z"></path></svg></button>');
    }
    function getAccessTokenInputId(authModalId) {
        return `${authModalId}-input`;
    }
    function buildOrderedListOfInstructions(authModalId) {
        return $("<ol></ol>").append(`<li><a class="s-link s-link__underlined" href="${seTokenAuthRoute}" target="_blank" rel="noopener noreferrer">Authorise App</a></li>`).append(`<li><label for="${getAccessTokenInputId(authModalId)}" class="mr6">Access Token:</label><input style="width:225px" id="${getAccessTokenInputId(authModalId)}"/></li>`);
    }
    function buildFormControlButtons(authModalId) {
        const submitButton = $(`<button class="flex--item s-btn s-btn__primary" type="button" id="${authModalId}-save">Save</button>`);
        submitButton.on("click", (ev => {
            ev.preventDefault();
            const inputValue = $(`#${getAccessTokenInputId(authModalId)}`).val();
            if (void 0 !== inputValue && inputValue.length > 0) {
                GM_setValue(seApiToken, inputValue);
                requestNewJwt().then((() => {
                    window.location.reload();
                }));
            }
        }));
        return $('<div class="d-flex g8 gsx s-modal--footer"></div>').append(submitButton).append('<button class="flex--item s-btn" type="button" data-action="s-modal#hide">Cancel</button>');
    }
    function getFormDataFromObject(obj) {
        return Object.entries(obj).reduce(((acc, [key, value]) => {
            acc.set(key, value);
            return acc;
        }), new FormData);
    }
    function fetchPostFormData(endPoint, data) {
        return fetch(endPoint, {
            method: "POST",
            body: getFormDataFromObject(data)
        });
    }
    function fetchPostFormDataBodyJsonResponse(endPoint, data) {
        return fetchPostFormData(endPoint, data).then((res => res.json()));
    }
    function addComment(postId, commentText) {
        return fetchPostFormData(`/posts/${postId}/comments`, {
            fkey: StackExchange.options.user.fkey,
            comment: commentText
        });
    }
    function flagPost(flagType, postId, otherText, overrideWarning, customData) {
        const data = {
            fkey: StackExchange.options.user.fkey,
            otherText: otherText ?? ""
        };
        if (void 0 !== overrideWarning) {
            data.overrideWarning = overrideWarning;
        }
        if (void 0 !== customData) {
            data.customData = JSON.stringify(customData);
        }
        return fetchPostFormDataBodyJsonResponse(`/flags/posts/${postId}/add/${flagType}`, data);
    }
    function flagPlagiarizedContent(postId, originalSource, detailText) {
        return flagPost("PlagiarizedContent", postId, detailText, false, {
            plagiarizedSource: originalSource
        });
    }
    function deleteAsPlagiarism(postId) {
        return fetchPostFormData(`/admin/posts/${postId}/delete-as-plagiarism`, {
            fkey: StackExchange.options.user.fkey
        });
    }
    function removeModalFromDOM(modalId) {
        const existingModal = document.getElementById(modalId);
        if (null !== existingModal) {
            Stacks.hideModal(existingModal);
            setTimeout((() => {
                existingModal.remove();
            }), 125);
        }
    }
    function isInValidationBounds(textLength, bounds) {
        const min = bounds.min ?? 0;
        if (void 0 === bounds.max) {
            return min <= textLength;
        }
        return min <= textLength && textLength <= bounds.max;
    }
    const plagiarismFlagLengthBounds = {
        source: {
            min: 10
        },
        explanation: {
            min: 10,
            max: 500
        }
    };
    function assertValidPlagiarismFlagTextLengths(sourceLength, explanationLength) {
        if (!isInValidationBounds(sourceLength, plagiarismFlagLengthBounds.source)) {
            throw new Error(`Plagiarism flag source must be more than ${plagiarismFlagLengthBounds.source.min} characters.`);
        }
        if (!isInValidationBounds(explanationLength, plagiarismFlagLengthBounds.explanation)) {
            throw new Error(`Plagiarism flag explanation text must be between ${plagiarismFlagLengthBounds.explanation.min} and ${plagiarismFlagLengthBounds.explanation.max} characters.`);
        }
        return true;
    }
    const commentTextLengthBounds = {
        min: 15,
        max: 600
    };
    function assertValidCommentTextLength(commentLength) {
        if (!isInValidationBounds(commentLength, commentTextLengthBounds)) {
            throw new Error(`Comment text must be between ${commentTextLengthBounds.min} and ${commentTextLengthBounds.max} characters.`);
        }
        return true;
    }
    function getMessageFromCaughtElement(e) {
        if (e instanceof Error) {
            return e.message;
        } else if ("string" === typeof e) {
            return e;
        } else {
            console.error(e);
            return "Something went wrong!";
        }
    }
    function getModalId(postId) {
        return "socm-handle-post-form-{postId}".formatUnicorn({
            postId: postId
        });
    }
    function handleHandlePostButtonClick(isModerator, postId, postOwnerId) {
        const modalId = getModalId(postId);
        const modal = document.getElementById(modalId);
        if (null !== modal) {
            Stacks.showModal(modal);
        } else {
            $("body").append((isModerator ? '<aside class="s-modal s-modal__danger" id="{modalId}" tabindex="-1" role="dialog" aria-hidden="true" data-controller="s-modal" data-s-modal-target="modal"><div class="s-modal--dialog" style="min-width:550px; width: max-content; max-width: 65vw;" role="document" data-controller="socm-handle-post-form se-draggable"><h1 class="s-modal--header c-move" data-se-draggable-target="handle">Nuke Plagiarism</h1><div class="s-modal--body" style="margin-bottom: 0;"><div class="d-flex fd-column g8"><div class="d-flex ai-center g8 jc-space-between"><label class="s-label" for="socm-flag-enable-toggle-{postId}">Flag before deletion</label><input class="s-toggle-switch" id="socm-flag-enable-toggle-{postId}" data-socm-handle-post-form-target="flag-enable-toggle" data-socm-handle-post-form-controls-param="flag-info-area" data-action="change->socm-handle-post-form#handleUpdateControlledField" type="checkbox"></div><div class="d-flex fd-column g8" data-socm-handle-post-form-target="flag-info-area"><div class="d-flex ff-column-nowrap gs4 gsy"><div class="flex--item"><label class="d-block s-label" for="socm-flag-original-source-area-{postId}">Link(s) to original content</label></div><div class="d-flex ps-relative"><input type="text" id="socm-flag-original-source-area-{postId}" class="s-input" name="flag source link" data-socm-handle-post-form-target="flag-original-source-area"></div></div><div class="d-flex ff-column-nowrap gs4 gsy" data-controller="se-char-counter" data-se-char-counter-min="10" data-se-char-counter-max="500"><label class="s-label flex--item" for="socm-flag-detail-area-{postId}">Why do you consider this answer to be plagiarized?</label><textarea class="flex--item s-textarea" data-se-char-counter-target="field" data-is-valid-length="false" id="socm-flag-detail-area-{postId}" name="flag detail text" rows="5" data-socm-handle-post-form-target="flag-detail-area"></textarea><div data-se-char-counter-target="output"></div></div></div><div class="my6 bb bc-black-400"></div><div class="d-flex ai-center g8 jc-space-between"><label class="s-label" for="socm-comment-enable-toggle-{postId}">Comment after deletion</label><input class="s-toggle-switch" id="socm-comment-enable-toggle-{postId}" data-socm-handle-post-form-target="comment-enable-toggle" data-socm-handle-post-form-controls-param="comment-info-area" data-action="change->socm-handle-post-form#handleUpdateControlledField" type="checkbox"></div><div class="d-flex fd-column g8" data-socm-handle-post-form-target="comment-info-area"><div class="d-flex ff-column-nowrap gs4 gsy" data-controller="se-char-counter" data-se-char-counter-min="15" data-se-char-counter-max="600"><label class="s-label flex--item" for="socm-comment-area-{postId}">Comment Text</label><textarea class="flex--item s-textarea" data-se-char-counter-target="field" data-is-valid-length="false" id="socm-comment-area-{postId}" name="comment text" rows="5" data-socm-handle-post-form-target="comment-area"></textarea><div data-se-char-counter-target="output"></div></div></div><div class="my6 bb bc-black-400"></div><div class="d-flex ai-center g8 jc-space-between"><label class="s-label" for="socm-log-post-toggle-{postId}">Log post in Case Manager</label><input class="s-toggle-switch" id="socm-log-post-toggle-{postId}" data-socm-handle-post-form-target="log-enable-toggle" type="checkbox"></div></div></div><div class="d-flex gx8 s-modal--footer ai-center"><button class="s-btn flex--item s-btn__filled s-btn__danger" type="button" data-socm-handle-post-form-target="submit-button" data-action="click->socm-handle-post-form#handleNukeSubmitActions" data-socm-handle-post-form-post-id-param="{postId}" data-socm-handle-post-form-post-owner-param="{postOwnerId}">Nuke Post</button><button class="s-btn flex--item s-btn__muted" type="button" data-action="click->socm-handle-post-form#cancelHandleForm" data-socm-handle-post-form-post-id-param="{postId}">Cancel</button><a class="fs-fine ml-auto" href="/users/current?tab=case-manager-settings" target="_blank">Configure default options</a></div><button class="s-modal--close s-btn s-btn__muted" type="button" aria-label="Close" data-action="s-modal#hide"><svg aria-hidden="true" class="svg-icon iconClearSm" width="14" height="14" viewBox="0 0 14 14"><path d="M12 3.41 10.59 2 7 5.59 3.41 2 2 3.41 5.59 7 2 10.59 3.41 12 7 8.41 10.59 12 12 10.59 8.41 7 12 3.41Z"></path></svg></button></div></aside>' : '<aside class="s-modal s-modal__danger" id="{modalId}" tabindex="-1" role="dialog" aria-hidden="true" data-controller="s-modal" data-s-modal-target="modal"><div class="s-modal--dialog" style="min-width:550px; width: max-content; max-width: 65vw;" role="document" data-controller="socm-handle-post-form se-draggable"><h1 class="s-modal--header c-move" data-se-draggable-target="handle">Flag Plagiarism</h1><div class="s-modal--body" style="margin-bottom: 0;"><div class="d-flex fd-column g8"><div class="d-flex ff-column-nowrap gs4 gsy"><div class="flex--item"><label class="d-block s-label" for="socm-flag-original-source-area-{postId}">Link(s) to original content</label></div><div class="d-flex ps-relative"><input type="text" id="socm-flag-original-source-area-{postId}" class="s-input" name="flag source link" data-socm-handle-post-form-target="flag-original-source-area"></div></div><div class="d-flex ff-column-nowrap gs4 gsy" data-controller="se-char-counter" data-se-char-counter-min="10" data-se-char-counter-max="500"><label class="s-label flex--item" for="socm-flag-detail-area-{postId}">Why do you consider this answer to be plagiarized?</label><textarea class="flex--item s-textarea" data-se-char-counter-target="field" data-is-valid-length="false" id="socm-flag-detail-area-{postId}" name="flag detail text" rows="5" data-socm-handle-post-form-target="flag-detail-area"></textarea><div data-se-char-counter-target="output"></div></div><div class="my6 bb bc-black-400"></div><div class="d-flex ai-center g8 jc-space-between"><label class="s-label" for="socm-log-post-toggle-{postId}">Log post in Case Manager</label><input class="s-toggle-switch" id="socm-log-post-toggle-{postId}" data-socm-handle-post-form-target="log-enable-toggle" type="checkbox"></div></div></div><div class="d-flex gx8 s-modal--footer ai-center"><button class="s-btn flex--item s-btn__filled s-btn__danger" type="button" data-socm-handle-post-form-target="submit-button" data-action="click->socm-handle-post-form#handleFlagSubmitActions" data-socm-handle-post-form-post-id-param="{postId}" data-socm-handle-post-form-post-owner-param="{postOwnerId}">Flag Post</button><button class="s-btn flex--item s-btn__muted" type="button" data-action="click->socm-handle-post-form#cancelHandleForm" data-socm-handle-post-form-post-id-param="{postId}">Cancel</button></div><button class="s-modal--close s-btn s-btn__muted" type="button" aria-label="Close" data-action="s-modal#hide"><svg aria-hidden="true" class="svg-icon iconClearSm" width="14" height="14" viewBox="0 0 14 14"><path d="M12 3.41 10.59 2 7 5.59 3.41 2 2 3.41 5.59 7 2 10.59 3.41 12 7 8.41 10.59 12 12 10.59 8.41 7 12 3.41Z"></path></svg></button></div></aside>').formatUnicorn({
                modalId: modalId,
                postId: postId,
                postOwnerId: postOwnerId
            }));
            setTimeout((() => {
                Stacks.showModal(document.getElementById(modalId));
            }), 50);
        }
    }
    function buildHandlePostButton(isModerator, isDeleted, answerId, postOwnerId) {
        const button = $(`<button ${isDeleted ? "disabled" : ""}  class="ml-auto s-btn s-btn__danger s-btn__outlined" type="button">${isModerator ? "Nuke" : "Flag"} as plagiarism</button>`);
        button.on("click", (() => {
            handleHandlePostButtonClick(isModerator, answerId, postOwnerId);
        }));
        return button;
    }
    function registerModHandlePostStacksController() {
        Stacks.addController("socm-handle-post-form", {
            targets: [ "submit-button", "flag-enable-toggle", "comment-enable-toggle", "log-enable-toggle", "flag-info-area", "comment-info-area", "flag-original-source-area", "flag-detail-area", "comment-area" ],
            get shouldFlag() {
                return this["flag-enable-toggleTarget"].checked;
            },
            get shouldComment() {
                return this["comment-enable-toggleTarget"].checked;
            },
            get shouldLog() {
                return this["log-enable-toggleTarget"].checked;
            },
            get commentText() {
                return this["comment-areaTarget"].value ?? "";
            },
            get flagOriginalSourceText() {
                return this["flag-original-source-areaTarget"].value ?? "";
            },
            get flagDetailText() {
                return this["flag-detail-areaTarget"].value ?? "";
            },
            connect() {
                const nukePostConfig = JSON.parse(GM_getValue(nukePostOptions, nukePostDefaultConfigString));
                this["flag-enable-toggleTarget"].checked = nukePostConfig.flag;
                this["comment-enable-toggleTarget"].checked = nukePostConfig.comment;
                this["log-enable-toggleTarget"].checked = nukePostConfig.log;
                if (!nukePostConfig.flag) {
                    $(this["flag-info-areaTarget"]).addClass("d-none");
                }
                if (!nukePostConfig.comment) {
                    $(this["comment-info-areaTarget"]).addClass("d-none");
                }
                this["flag-detail-areaTarget"].value = nukePostConfig.flagDetailText ?? "";
                this["comment-areaTarget"].value = nukePostConfig.commentText ?? "";
            },
            async handleNukeSubmitActions(ev) {
                await submitHandlerTemplate(ev, $(this["submit-buttonTarget"]), (async (postOwner, postId) => {
                    await handlePlagiarisedPost(postId, postOwner, this.flagOriginalSourceText, this.flagDetailText, this.commentText, this.shouldFlag, true, this.shouldComment, this.shouldLog);
                    window.location.reload();
                }));
            },
            cancelHandleForm(ev) {
                ev.preventDefault();
                const {postId: postId} = ev.params;
                removeModalFromDOM(getModalId(postId));
            },
            handleUpdateControlledField(ev) {
                const {controls: controls} = ev.params;
                if (ev.target.checked) {
                    $(this[`${controls}Target`]).removeClass("d-none");
                } else {
                    $(this[`${controls}Target`]).addClass("d-none");
                }
            }
        });
    }
    function registerNonModHandlePostStacksController() {
        Stacks.addController("socm-handle-post-form", {
            targets: [ "flag-original-source-area", "flag-detail-area", "log-enable-toggle", "submit-button" ],
            get shouldLog() {
                return this["log-enable-toggleTarget"].checked;
            },
            get flagOriginalSourceText() {
                return this["flag-original-source-areaTarget"].value ?? "";
            },
            get flagDetailText() {
                return this["flag-detail-areaTarget"].value ?? "";
            },
            connect() {
                this["log-enable-toggleTarget"].checked = true;
            },
            async handleFlagSubmitActions(ev) {
                await submitHandlerTemplate(ev, $(this["submit-buttonTarget"]), (async (postOwner, postId) => {
                    const resolveMessage = await handlePlagiarisedPost(postId, postOwner, this.flagOriginalSourceText, this.flagDetailText, "", true, false, false, this.shouldLog);
                    removeModalFromDOM(getModalId(postId));
                    if (void 0 !== resolveMessage) {
                        StackExchange.helpers.showToast(resolveMessage);
                    }
                }));
            },
            cancelHandleForm(ev) {
                ev.preventDefault();
                const {postId: postId} = ev.params;
                removeModalFromDOM(getModalId(postId));
            }
        });
    }
    async function submitHandlerTemplate(ev, jSubmitButton, uniqueHandleActions) {
        ev.preventDefault();
        jSubmitButton.prop("disabled", true).addClass("is-loading");
        const {postOwner: postOwner, postId: postId} = ev.params;
        try {
            await uniqueHandleActions(postOwner, postId);
        } catch (error) {
            StackExchange.helpers.showToast(getMessageFromCaughtElement(error), {
                type: "danger"
            });
            jSubmitButton.prop("disabled", false).removeClass("is-loading");
        }
    }
    async function handlePlagiarisedPost(answerId, ownerId, flagOriginalSourceText, flagDetailText, commentText, shouldFlagPost, shouldDeletePost, shouldCommentPost, shouldLogWithAws) {
        if (shouldFlagPost) {
            assertValidPlagiarismFlagTextLengths(flagOriginalSourceText.length, flagDetailText.length);
        }
        if (shouldCommentPost) {
            assertValidCommentTextLength(commentText.length);
        }
        let resolveMessage;
        if (shouldFlagPost) {
            const flagFetch = await flagPlagiarizedContent(answerId, flagOriginalSourceText, flagDetailText);
            if (!flagFetch.Success) {
                throw new Error(flagFetch.Message);
            }
            if (!shouldDeletePost) {
                resolveMessage = flagFetch.Message;
            }
        }
        if (shouldDeletePost) {
            const deleteFetch = await deleteAsPlagiarism(answerId);
            if (200 !== deleteFetch.status) {
                throw new Error('Something went wrong when deleting "as plagiarism"!');
            }
        }
        if (shouldCommentPost) {
            await void addComment(answerId, commentText);
        }
        if (shouldLogWithAws) {
            const body = {};
            if (-1 !== ownerId) {
                body.postOwnerId = ownerId;
            }
            const actions = [ 3 ];
            if (shouldDeletePost) {
                actions.push(4);
            }
            body.actionIds = actions;
            await void fetchFromAWS(`/handle/post/${answerId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });
        }
        return resolveMessage;
    }
    const popoverMountPointClass = "popover-mount-point";
    function getTimelineButtonId(answerId) {
        return `${answerId}-timeline-indicator-button`;
    }
    function getTimelinePopoverId(answerId) {
        return `case-manager-timeline-popover-${answerId}`;
    }
    function getActionsButtonId(answerId) {
        return `${answerId}-post-actions-button`;
    }
    function getActionsPopoverId(answerId) {
        return `case-manager-answer-popover-${answerId}`;
    }
    function buildAlertSvg(dim = 18, viewBox = 18) {
        return `<svg aria-hidden="true" class="svg-icon iconAlert" width="${dim}" height="${dim}" viewBox="0 0 ${viewBox} ${viewBox}"><path d="M7.95 2.71c.58-.94 1.52-.94 2.1 0l7.69 12.58c.58.94.15 1.71-.96 1.71H1.22C.1 17-.32 16.23.26 15.29L7.95 2.71ZM8 6v5h2V6H8Zm0 7v2h2v-2H8Z"></path></svg>`;
    }
    function buildCaseSvg(dim = 18, viewBox = 18) {
        return `<svg aria-hidden="true" class="svg-icon iconBriefcase" width="${dim}" height="${dim}" viewBox="0 0 ${viewBox} ${viewBox}"><path d="M5 4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7c0-1.1.9-2 2-2h1V4Zm7 0H6v1h6V4Z"></path></svg>`;
    }
    function buildCheckmarkSvg(dim = 18, viewBox = 18) {
        return `<svg aria-hidden="true" class="svg-icon iconCheckmark" width="${dim}" height="${dim}" viewBox="0 0 ${viewBox} ${viewBox}"><path d="M16 4.41 14.59 3 6 11.59 2.41 8 1 9.41l5 5 10-10Z"></path></svg>`;
    }
    function buildSearchSvg(dim = 18, viewBox = 18) {
        return `<svg aria-hidden="true" class="s-input-icon s-input-icon__search svg-icon iconSearch" width="${dim}" height="${dim}" viewBox="0 0 ${viewBox} ${viewBox}"><path d="m18 16.5-5.14-5.18h-.35a7 7 0 1 0-1.19 1.19v.35L16.5 18l1.5-1.5ZM12 7A5 5 0 1 1 2 7a5 5 0 0 1 10 0Z"></path></svg>`;
    }
    const stackExchangeDateTimeFormat = new Intl.DateTimeFormat(void 0, {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
        hour12: false
    });
    function toStackExchangeDateFormat(dateString) {
        const parts = stackExchangeDateTimeFormat.formatToParts(new Date(dateString));
        parts[5].value = " at ";
        return parts.map((v => v.value)).join("");
    }
    function buildBaseTimelineButtons(answerId) {
        const controlButton = $(`<button id="${getTimelineButtonId(answerId)}" class="flex--item s-btn s-btn__danger ws-nowrap" type="button" disabled>Post Timeline</button>`);
        const popOver = $(`<div class="s-popover" style="max-width: max-content;" id="${getTimelinePopoverId(answerId)}" role="menu"><div class="s-popover--arrow"/><div class="${popoverMountPointClass}"><div class="is-loading">Loading…</div></div></div>`);
        return $(document.createDocumentFragment()).append(controlButton).append(popOver);
    }
    function activateTimelineButton(postId) {
        const id = getTimelineButtonId(postId);
        $(`#${id}`).replaceWith(buildActiveTimelineButton(id, postId));
    }
    function buildActiveTimelineButton(buttonId, answerId) {
        const timelinePopoverId = getTimelinePopoverId(answerId);
        const timelineButton = $(`<button title="Click to view a record of actions taken on this post." id="${buttonId}" class="flex--item s-btn s-btn__danger s-btn__icon ws-nowrap s-btn__dropdown"  role="button" aria-controls="${timelinePopoverId}" aria-expanded="false" data-controller="s-popover" data-action="s-popover#toggle" data-s-popover-placement="top-start" data-s-popover-toggle-class="is-selected">${buildAlertSvg()}<span class="px8">Post Timeline</span></button>`);
        timelineButton.on("click", (ev => {
            ev.preventDefault();
            if ("true" !== timelineButton.attr("timeline-loaded")) {
                fetchFromAWS(`/timeline/post/${answerId}`).then((res => res.json())).then((timelineEvents => {
                    const eventPane = $('<div class="case-manager-post-timeline-container"></div>');
                    eventPane.append($("<h3>Case Manager Post Timeline</h3>"));
                    const timelineEventContainer = $('<div class="d-grid ws-nowrap" style="grid-template-columns: repeat(3, min-content); grid-gap: var(--su8);"></div>');
                    for (const event of timelineEvents) {
                        timelineEventContainer.append($(`<a href="/users/${event.account_id}">${event.display_name}</a><span data-event-type-id="${event.timeline_event_type}">${event.timeline_event_description}</span><span title="${event.event_creation_date}">${toStackExchangeDateFormat(event.event_creation_date)}</span>`));
                    }
                    eventPane.append(timelineEventContainer);
                    $(`#${timelinePopoverId} > .${popoverMountPointClass}`).empty().append(eventPane);
                    timelineButton.attr("timeline-loaded", "true");
                }));
            }
        }));
        return timelineButton;
    }
    function buildActionsComponent(answerId, ownerId, isDeleted) {
        const controlButton = $(`<button id="${getActionsButtonId(answerId)}" title="Click to record an action you have taken on this post." class="s-btn s-btn__dropdown" role="button" aria-controls="${getActionsPopoverId(answerId)}" aria-expanded="false" data-controller="s-popover" data-action="s-popover#toggle" data-s-popover-placement="top-end" data-s-popover-toggle-class="is-selected">Record Post Action</button>`);
        const popOver = $(`<div class="s-popover" style="width: 250px;" id="${getActionsPopoverId(answerId)}" role="menu"><div class="s-popover--arrow"/><div class="${popoverMountPointClass}"><div class="is-loading">Loading…</div></div></div>`);
        controlButton.on("click", (ev => {
            ev.preventDefault();
            if ("true" !== controlButton.attr("options-loaded")) {
                fetchFromAWS(`/handle/post/${answerId}`).then((res => res.json())).then((actions => {
                    buildActionsComponentFromActions(answerId, ownerId, isDeleted, actions);
                    controlButton.attr("options-loaded", "true");
                }));
            }
        }));
        return $(document.createDocumentFragment()).append(controlButton).append(popOver);
    }
    function buildActionsComponentFromActions(answerId, ownerId, isDeleted, actions) {
        const popOverInnerContainer = $('<div class="case-manager-post-action-container"><h3>Case Manager Post Action Panel</h3></div>');
        const actionsForm = $('<form class="d-grid grid__1 g6" style="grid-auto-rows: 1fr"></form>');
        const radioGroupName = `radio-action-${answerId}`;
        let hasAnyAction = false;
        for (const action of actions) {
            const actionRow = $('<div class="grid--item d-flex fd-row jc-space-between ai-center"></div>');
            const radioId = getActionRadioButtonId(answerId, action.action_id);
            const radioButton = $(`<div class="flex--item s-check-control"><input class="s-radio" type="radio" name="${radioGroupName}" value="${action.action_description}" data-action-id="${action.action_id}" id="${radioId}"${action.user_acted ? " checked" : ""}/><label class="flex--item s-label fw-normal" for="${radioId}">${action.action_description}</label></div>`);
            actionRow.append(radioButton);
            if (action.user_acted) {
                hasAnyAction = true;
                const clearButton = $('<button class="s-btn s-btn__danger" type="button">Clear</button>');
                clearButton.on("click", clearMyActionHandler(action, answerId));
                actionRow.append(clearButton);
            }
            actionsForm.append(actionRow);
        }
        if (hasAnyAction) {
            actionsForm.find(`input[name="${radioGroupName}"]`).prop("disabled", true);
        }
        actionsForm.append($('\n<div class="d-flex fd-row jc-start">\n<button class="s-btn s-btn__primary" type="submit">Save</button>\n<button class="s-btn" type="reset">Reset</button>\n</div>\n'));
        actionsForm.on("submit", handleFormAction(actionsForm, answerId, ownerId, isDeleted));
        popOverInnerContainer.append(actionsForm);
        $(`#${getActionsPopoverId(answerId)} > .${popoverMountPointClass}`).empty().append(popOverInnerContainer);
    }
    function getActionRadioButtonId(answerId, action_id) {
        return `radio-button-${answerId}-${action_id}`;
    }
    function clearMyActionHandler(action, answerId) {
        return ev => {
            ev.preventDefault();
            StackExchange.helpers.showConfirmModal({
                title: "Remove your action",
                bodyHtml: `<span>Are you sure you want to remove your "${action.action_description}" action from this post?</span>`,
                buttonLabel: "Remove Action"
            }).then((confirm => {
                if (confirm) {
                    fetchFromAWS(`/handle/post/${answerId}/${action.action_id}`, {
                        method: "DELETE"
                    }).then((res => {
                        if (200 === res.status) {
                            $(`#${getActionsButtonId(answerId)}`).attr("options-loaded", "false");
                            $(`#${getTimelineButtonId(answerId)}`).attr("timeline-loaded", "false");
                        }
                    }));
                }
            }));
        };
    }
    function handleFormAction(form, answerId, ownerId, isDeleted) {
        return ev => {
            ev.preventDefault();
            const submitButton = form.find('button[type="submit"]');
            submitButton.prop("disabled", true);
            const actions = form.find('input[type="radio"]:checked:not(:disabled)');
            if (0 === actions.length) {
                submitButton.prop("disabled", false);
                return;
            }
            const body = {};
            if (-1 !== ownerId) {
                body.postOwnerId = ownerId;
            }
            const parsedActions = actions.map(((i, e) => {
                const id = $(e).attr("data-action-id");
                if (void 0 === id) {
                    return;
                } else {
                    return Number(id);
                }
            })).toArray();
            if (isDeleted) {
                parsedActions.push(4);
            }
            body.actionIds = parsedActions;
            fetchFromAWS(`/handle/post/${answerId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            }).then((res => res.json())).then((actions2 => {
                activateTimelineButton(answerId);
                buildActionsComponentFromActions(answerId, ownerId, isDeleted, actions2);
            })).catch((() => {
                submitButton.prop("disabled", false);
            }));
        };
    }
    function buildAnswerControlPanel() {
        const answers = $("div.answer");
        const answerIds = answers.map(((i, e) => getAnswerIdFromAnswerDiv(e))).toArray();
        const isModerator = true === StackExchange.options.user.isModerator;
        for (const {jAnswer: jAnswer, isDeleted: isDeleted, answerId: answerId, postOwnerId: postOwnerId} of extractFromAnswerDivs(answers, answerIds)) {
            const controlPanel = $('<div class="p8 g8 d-flex fd-row jc-space-between ai-center"></div>');
            controlPanel.append(buildBaseTimelineButtons(answerId));
            controlPanel.append(buildHandlePostButton(isModerator, isDeleted, answerId, postOwnerId));
            controlPanel.append(buildActionsComponent(answerId, postOwnerId, isDeleted));
            jAnswer.append(controlPanel);
        }
        if (isModerator) {
            registerModHandlePostStacksController();
        } else {
            registerNonModHandlePostStacksController();
        }
        delayPullSummaryPostInfo(answerIds);
    }
    function getAnswerIdFromAnswerDiv(answerDiv) {
        return Number($(answerDiv).attr("data-answerid"));
    }
    function* extractFromAnswerDivs(answers, answerIds) {
        for (let i = 0; i < answers.length; i++) {
            const jAnswer = $(answers[i]);
            const isDeleted = jAnswer.hasClass("deleted-answer");
            const answerId = answerIds[i];
            const postOwnerId = getPostOwnerIdFromAuthorDiv(jAnswer.find('div[itemprop="author"]'));
            if (void 0 === answerId || postOwnerId === StackExchange.options.user.userId) {
                continue;
            }
            yield {
                jAnswer: jAnswer,
                isDeleted: isDeleted,
                answerId: answerId,
                postOwnerId: postOwnerId
            };
        }
    }
    function delayPullSummaryPostInfo(answerIds) {
        getSummaryPostInfoFromIds(answerIds).then((setPostIds => {
            for (const postId of setPostIds) {
                activateTimelineButton(postId);
            }
        })).catch((err => {
            console.error(err);
        }));
    }
    function getPostOwnerIdFromAuthorDiv(authorDiv) {
        const e = $(authorDiv).find("a");
        if (0 === e.length) {
            return -1;
        }
        const href = e.attr("href");
        if (void 0 === href) {
            return -1;
        }
        const match = href.match(/\/users\/(\d+)\/.*/);
        if (null === match) {
            return -1;
        }
        return Number(match[1]);
    }
    function buildExistingTokensControls() {
        return $("<div></div>").append('<h3 class="fs-title mb12">Existing Auth Tokens</h3>').append(buildTokenList()).append(buildDeAuthoriseButton());
    }
    function buildTokenList() {
        const tokenList = $('<div><div class="is-loading">Loading...</div></div>');
        fetchFromAWS("/auth/credentials").then((res => res.json())).then((tokens => {
            tokenList.empty();
            tokens.forEach((token => {
                tokenList.append(buildTokenRow(token));
            }));
        }));
        return tokenList;
    }
    function buildTokenRow(token) {
        const tokenRow = $('<div class="d-flex fd-row ai-center"></div>');
        const invalidateButton = $('<button class="s-btn s-btn__danger">Invalidate</button>');
        invalidateButton.on("click", (ev => {
            ev.preventDefault();
            fetchFromAWS(`/auth/credentials/${token}/invalidate`).then((res => {
                if (200 === res.status) {
                    tokenRow.remove();
                    if (GM_getValue(seApiToken) === token) {
                        GM_deleteValue(seApiToken);
                        GM_deleteValue(accessToken);
                        window.location.reload();
                    }
                }
            }));
        }));
        return tokenRow.append(`<span>${token}</span>`).append(invalidateButton);
    }
    function buildDeAuthoriseButton() {
        const deAuthoriseButton = $('<button class="s-btn s-btn__outlined s-btn__danger mt16" id="app-24380">De-authenticate Application</button>');
        deAuthoriseButton.on("click", (ev => {
            ev.preventDefault();
            StackExchange.helpers.showConfirmModal({
                title: "De-authenticate this Application",
                bodyHtml: "<p>Are you sure you want to de-authenticate this application? All existing access tokens will be invalidated and removed from storage. This app will no longer appear in your authorized applications list. You will no longer be able to use any existing access tokens and will need to reauthenticate to continue use.</p><p><b>Note:</b> All of your actions will be retained and associated to your user id even after de-authenticating. You may resume access at any time by authorising the application again.</p>",
                buttonLabel: "De-authenticate"
            }).then((confirm => {
                if (confirm) {
                    fetchFromAWS(`/auth/credentials/${GM_getValue(seApiToken)}/de-authenticate`).then((res => {
                        if (200 === res.status) {
                            GM_deleteValue(seApiToken);
                            GM_deleteValue(accessToken);
                            window.location.reload();
                        }
                    }));
                }
            }));
        }));
        return deAuthoriseButton;
    }
    function buildTokenIssuer() {
        return $("<div></div>").append('<h3 class="fs-title mb12">Issue new token</h3>').append("<p>You can issue a new auth token for use on another device or to manually replace an existing token. Please invalidate any existing tokens, so they can no longer be used to access your information.</p>").append(`<a class="s-link s-link__underlined" href="${seTokenAuthRoute}" target="_blank" rel="noopener noreferrer">Issue new auth token</a>`);
    }
    function buildNukeConfigControls() {
        registerNukeConfigSettingsController();
        return $("<div></div>").append('<h3 class="fs-title mb12">Edit base options for nuking posts</h3>').append('<form class="d-flex fd-column g12" data-controller="socm-nuke-config-settings" data-action="submit->socm-nuke-config-settings#handleSaveConfig reset->socm-nuke-config-settings#handleResetConfig"><div class="s-check-control"><input class="s-checkbox" type="checkbox" id="socm-nuke-config-should-flag" data-socm-nuke-config-settings-target="nuke-config-should-flag" /><label class="s-label" for="socm-nuke-config-should-flag">Should Flag</label></div><div class="s-check-control"><input class="s-checkbox" type="checkbox" id="socm-nuke-config-should-comment" data-socm-nuke-config-settings-target="nuke-config-should-comment" /><label class="s-label" for="socm-nuke-config-should-comment">Should Comment</label></div><div class="s-check-control"><input class="s-checkbox" type="checkbox" id="socm-nuke-config-should-log" data-socm-nuke-config-settings-target="nuke-config-should-log" /><label class="s-label" for="socm-nuke-config-should-log">Should Log</label></div><div class="d-flex ff-column-nowrap gs4 gsy" data-controller="se-char-counter" data-se-char-counter-min="10" data-se-char-counter-max="500"><label class="s-label flex--item" for="socm-nuke-config-flag-template">Flag Detail Text Template:</label><textarea class="flex--item s-textarea" data-se-char-counter-target="field" data-is-valid-length="false" id="socm-nuke-config-flag-template" name="flag detail template" rows="5" data-socm-nuke-config-settings-target="nuke-config-flag-template"></textarea><div data-se-char-counter-target="output"></div></div><div class="d-flex ff-column-nowrap gs4 gsy" data-controller="se-char-counter" data-se-char-counter-min="15" data-se-char-counter-max="600"><label class="s-label flex--item" for="socm-nuke-config-comment-template">Comment Text Template:</label><textarea class="flex--item s-textarea" data-se-char-counter-target="field" data-is-valid-length="false" id="socm-nuke-config-comment-template" name="comment template" rows="5" data-socm-nuke-config-settings-target="nuke-config-comment-template"></textarea><div data-se-char-counter-target="output"></div></div><div class="d-flex fd-row g8"><button class="s-btn s-btn__primary" type="submit">Save Config</button><button class="s-btn s-btn__muted" type="reset">Reset To Default</button></div></form>');
    }
    function registerNukeConfigSettingsController() {
        Stacks.addController("socm-nuke-config-settings", {
            targets: [ "nuke-config-should-flag", "nuke-config-should-comment", "nuke-config-should-log", "nuke-config-flag-template", "nuke-config-comment-template" ],
            get shouldFlag() {
                return this["nuke-config-should-flagTarget"].checked;
            },
            get shouldComment() {
                return this["nuke-config-should-commentTarget"].checked;
            },
            get shouldLog() {
                return this["nuke-config-should-logTarget"].checked;
            },
            get commentTemplate() {
                return this["nuke-config-comment-templateTarget"].value ?? "";
            },
            get flagTemplate() {
                return this["nuke-config-flag-templateTarget"].value ?? "";
            },
            setValues(config) {
                this["nuke-config-should-flagTarget"].checked = config.flag;
                this["nuke-config-should-commentTarget"].checked = config.comment;
                this["nuke-config-should-logTarget"].checked = config.log;
                this["nuke-config-flag-templateTarget"].value = config.flagDetailText ?? "";
                this["nuke-config-comment-templateTarget"].value = config.commentText ?? "";
            },
            connect() {
                const nukePostConfig = JSON.parse(GM_getValue(nukePostOptions, nukePostDefaultConfigString));
                this.setValues(nukePostConfig);
            },
            handleSaveConfig(ev) {
                ev.preventDefault();
                try {
                    const newConfig = {
                        flagDetailText: this.flagTemplate,
                        commentText: this.commentTemplate,
                        flag: this.shouldFlag,
                        comment: this.shouldComment,
                        log: this.shouldLog
                    };
                    GM_setValue(nukePostOptions, JSON.stringify(newConfig));
                    StackExchange.helpers.showToast("Config updated successfully!", {
                        type: "success",
                        transientTimeout: 3e3
                    });
                } catch (e) {
                    StackExchange.helpers.showToast(getMessageFromCaughtElement(e), {
                        type: "danger",
                        transientTimeout: 5e3
                    });
                }
            },
            handleResetConfig(ev) {
                ev.preventDefault();
                const defaultConfig = JSON.parse(nukePostDefaultConfigString);
                this.setValues(defaultConfig);
            }
        });
    }
    function buildUserScriptSettingsPanel() {
        const container = $('<div class="s-page-title mb24"><h1 class="s-page-title--header m0 baw0 p0">Case Manager UserScript Settings</h1></div>');
        const toolGrid = $('<div class="d-grid grid__2 md:grid__1 g32"></div>');
        toolGrid.append(buildExistingTokensControls());
        toolGrid.append(buildTokenIssuer());
        if (StackExchange.options.user.isModerator) {
            toolGrid.append(buildNukeConfigControls());
        }
        return $(document.createDocumentFragment()).append(container).append(toolGrid);
    }
    function buildUserScriptSettingsNav() {
        addSettingsNavLink();
        if (window.location.search.startsWith("?tab=case-manager-settings")) {
            buildAndAttachSettingsPanel();
        }
    }
    function addSettingsNavLink() {
        $(".user-show-new .s-navigation:eq(0)").append($('<a href="/users/current?tab=case-manager-settings" class="s-navigation--item">Case Manager Settings</a>'));
    }
    function buildAndAttachSettingsPanel() {
        $("#mainbar-full").empty().append(buildUserScriptSettingsPanel());
    }
    function fetchFromSEAPI(path, search) {
        const usp = new URLSearchParams(search);
        usp.set("site", "stackoverflow");
        usp.set("key", "BkvRpNB*IzKMdjAcikc4jA((");
        usp.set("access_token", GM_getValue(seApiToken));
        return fetch(`https://api.stackexchange.com/2.3${path}?${usp.toString()}`);
    }
    function buildAndAttachCaseManagerControlPanel(userId) {
        $("#mainbar-full > div:last-child").replaceWith(new CaseManagerControlPanel(userId).init());
    }
    function buildSummaryTableFilterOption(text, value, activeValue) {
        return `<option value="${value}"${activeValue === value ? " selected" : ""}>${text}</option>`;
    }
    class CaseManagerControlPanel {
        container;
        userId;
        currentPage;
        pageLoadMap;
        postSummaryColumnFilter;
        constructor(userId) {
            this.userId = userId;
            this.container = $('<div class="d-flex mb48"></div>');
            this.currentPage = "summary";
            this.pageLoadMap = {
                summary: {
                    isLoaded: false
                },
                posts: {
                    isLoaded: false
                }
            };
            this.postSummaryColumnFilter = {};
        }
        getConfigFromUrl() {
            const usp = new URLSearchParams(window.location.search);
            if (!usp.has("page") || "summary" === usp.get("page")) {
                this.currentPage = "summary";
            } else if ("posts" === usp.get("page")) {
                this.currentPage = "posts";
            }
            if (usp.has("table-filter")) {
                this.postSummaryColumnFilter = JSON.parse(usp.get("table-filter"));
            }
        }
        init() {
            this.getConfigFromUrl();
            window.addEventListener("popstate", (() => {
                this.getConfigFromUrl();
                this.render();
            }));
            this.render();
            return this.container;
        }
        buildNavLi(text, href, pageName) {
            const li = $("<li></li>");
            const active = this.currentPage === pageName;
            const a = $(`<a class="s-navigation--item pr48 ps-relative${active ? " is-selected" : ""}" href="${href}">${text}</a>`);
            a.on("click", (ev => {
                ev.preventDefault();
                this.currentPage = pageName;
                if (!active) {
                    window.history.pushState({
                        cmcPageName: pageName
                    }, "", href);
                    this.render();
                }
            }));
            li.append(a);
            return li;
        }
        buildNav() {
            const nav = $('<nav class="flex--item fl-shrink0 mr32" role="navigation"></nav>');
            const ul = $('<ul class="s-navigation s-navigation__muted s-navigation__vertical"></ul>');
            const pathName = window.location.pathname;
            const usp = new URLSearchParams(window.location.search);
            usp.set("page", "summary");
            ul.append(this.buildNavLi("Summary", `${pathName}?${usp.toString()}`, "summary"));
            usp.set("page", "posts");
            ul.append(this.buildNavLi("Posts", `${pathName}?${usp.toString()}`, "posts"));
            nav.append(ul);
            return nav;
        }
        async getSummaryPageData() {
            if (this.pageLoadMap.summary.isLoaded && this.pageLoadMap.summary.pageData) {
                return this.pageLoadMap.summary.pageData;
            } else {
                const summaryPageData = await fetchFromAWS(`/case/summary/${this.userId}`).then((res => res.json()));
                this.pageLoadMap.summary = {
                    isLoaded: true,
                    pageData: summaryPageData
                };
                return summaryPageData;
            }
        }
        async buildCaseSummaryPage() {
            const section = $('<section class="flex--item fl-grow1 wmx100"><div class="s-page-title mb24"><h1 class="s-page-title--header m0 baw0 p0">Summary</h1></section>');
            const summaryPageData = await this.getSummaryPageData();
            const summaryPane = $('<div class="d-grid grid__2 md:grid__1 g8"></div>');
            summaryPane.append(buildCaseManagerPane(this.userId, summaryPageData.hasOpenCase));
            summaryPane.append(buildActionsSummaryPane(summaryPageData.postSummary));
            if (summaryPageData.caseTimeline.length > 0) {
                summaryPane.append(buildCaseHistoryPane(summaryPageData.caseTimeline));
            }
            section.append(summaryPane);
            return section;
        }
        cleanInitPostColumnFilters() {
            if (this.pageLoadMap.posts.isLoaded && void 0 !== this.pageLoadMap.posts.pageData) {
                this.pageLoadMap.posts.pageData.header.forEach(((_, index) => {
                    this.postSummaryColumnFilter[index] = "any";
                }));
                const usp = new URLSearchParams(window.location.search);
                usp.delete("table-filter");
                window.history.replaceState({}, "", `${window.location.pathname}?${usp.toString()}`);
            }
        }
        async getBreakdownData() {
            if (this.pageLoadMap.posts.isLoaded && this.pageLoadMap.posts.pageData) {
                return this.pageLoadMap.posts.pageData;
            } else {
                const summaryPageData = await fetchFromAWS(`/case/posts/${this.userId}`).then((res => res.json()));
                this.pageLoadMap.posts = {
                    isLoaded: true,
                    pageData: summaryPageData
                };
                if (0 === Object.keys(this.postSummaryColumnFilter).length) {
                    this.cleanInitPostColumnFilters();
                }
                return summaryPageData;
            }
        }
        updateFilter(index, filterType) {
            this.postSummaryColumnFilter[index] = filterType;
            const usp = new URLSearchParams(window.location.search);
            usp.set("table-filter", JSON.stringify(this.postSummaryColumnFilter));
            window.history.replaceState({}, "", `${window.location.pathname}?${usp.toString()}`);
        }
        async buildPostsBreakdownPage() {
            const section = $('<section class="flex--item fl-grow1 wmx100"><div class="s-page-title mb24">\n<h1 class="s-page-title--header m0 baw0 p0">Post Status Summary</h1></section>');
            const detailData = await this.getBreakdownData();
            const detailTableContainer = $('<div class="s-table-container" style="width:min-content"></div>');
            const detailTable = $('<table class="s-table"></table>');
            {
                const detailTableHead = $("<thead></thead>");
                const detailTableHeadTr = $("<tr></tr>");
                const filterTheadTr = $("<tr></tr>");
                detailData.header.forEach(((headerText, index) => {
                    const htmlId = `summary-post-col-filter-${index}`;
                    {
                        const th = $("<th></th>");
                        const label = $(`<label for="${htmlId}">${headerText}</label>`);
                        th.append(label);
                        detailTableHeadTr.append(th);
                    }
                    {
                        const th = $("<th></th>");
                        if (index > 0) {
                            const div = $('<div class="s-select" style="width:max-content;"></div>');
                            const select = $(`<select id="${htmlId}">\n${buildSummaryTableFilterOption("Any", "any", this.postSummaryColumnFilter[index])}\n${buildSummaryTableFilterOption("Checked", "checked", this.postSummaryColumnFilter[index])}\n${buildSummaryTableFilterOption("Unchecked", "unchecked", this.postSummaryColumnFilter[index])}\n</select>`);
                            select.on("change", (ev => {
                                ev.preventDefault();
                                this.updateFilter(index, ev.target.value);
                                this.render();
                            }));
                            div.append(select);
                            th.append(div);
                        } else {
                            const clearButton = $('<button type="button" class="s-btn s-btn__sm s-btn__muted s-btn__outlined">Clear Filters</button>');
                            clearButton.on("click", (ev => {
                                ev.preventDefault();
                                this.cleanInitPostColumnFilters();
                                this.render();
                            }));
                            th.append(clearButton);
                        }
                        filterTheadTr.append(th);
                    }
                }));
                detailTableHead.append(detailTableHeadTr);
                detailTableHead.append(filterTheadTr);
                detailTable.append(detailTableHead);
            }
            {
                const detailTableBody = $("<tbody></tbody>");
                detailData.body.forEach((row => {
                    if (row.some(((elem, index) => {
                        const value = this.postSummaryColumnFilter[index];
                        if ("any" === value) {
                            return false;
                        } else if ("checked" === value) {
                            return null === row[index];
                        } else {
                            return null !== row[index];
                        }
                    }))) {
                        return;
                    }
                    const detailTableBodyTr = $("<tr></tr>");
                    row.forEach(((elem, idx) => {
                        if (0 === idx) {
                            detailTableBodyTr.append(`<td><a class="flex--item" href="/a/${elem}" target="_blank" rel="noreferrer noopener">${elem}</a></td>`);
                        } else if (null !== elem) {
                            detailTableBodyTr.append(`<td>${buildCheckmarkSvg()}</td>`);
                        } else {
                            detailTableBodyTr.append("<td></td>");
                        }
                    }));
                    detailTableBody.append(detailTableBodyTr);
                }));
                detailTable.append(detailTableBody);
            }
            detailTableContainer.append(detailTable);
            section.append(detailTableContainer);
            return section;
        }
        rebuildContainer(section) {
            this.container.empty();
            this.container.append(this.buildNav());
            this.container.append(section);
        }
        render() {
            if ("summary" === this.currentPage) {
                this.buildCaseSummaryPage().then((section => {
                    this.rebuildContainer(section);
                }));
            } else if ("posts" === this.currentPage) {
                this.buildPostsBreakdownPage().then((section => {
                    this.rebuildContainer(section);
                }));
            }
        }
    }
    function buildCaseManagerPane(userId, isActive) {
        const container = $('<div class="grid--item"></div>');
        const config = isActive ? {
            containerText: "This user is <strong>currently under investigation</strong>.",
            buttonText: "Close current investigation",
            apiRoute: "close",
            buttonClasses: "s-btn__primary",
            modalOptions: {
                title: "Close Current Investigation",
                body: "Are you sure you want to close out the current investigation of this user? This will remove the user from the active cases list. Please only do this if the majority of posts have either been actioned on or if the user is not a serial plagiarist.",
                buttonLabel: "Yes, I'm sure"
            }
        } : {
            containerText: "This user is <u>not</u> currently under investigation.",
            buttonText: "Open an investigation",
            apiRoute: "open",
            buttonClasses: "s-btn__danger s-btn__filled",
            modalOptions: {
                title: "Open An Investigation",
                body: "Are you sure you want to open an investigation into this user? This will add this user to a list of users under investigation. Please only do this if you suspect the user of serial plagiarism.",
                buttonLabel: "Yes, I'm sure"
            }
        };
        container.append($('<h3 class="fs-title mb8">Case Management Console</h3>'));
        container.append($(`<p>${config.containerText}</p>`));
        const button = $(`<button class="ml16 s-btn ${config.buttonClasses}">${config.buttonText}</button>`);
        button.on("click", (ev => {
            ev.preventDefault();
            StackExchange.helpers.showConfirmModal(config.modalOptions).then((shouldContinue => {
                if (shouldContinue) {
                    (isActive ? fetchFromAWS(`/case/${config.apiRoute}`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            userId: userId
                        })
                    }) : fetchFromSEAPI(`/users/${userId}`, "filter=!LnNkvqQOuAK0z-T)oydzPI").then((res => res.json())).then((resData => {
                        if (0 === resData.items.length) {
                            throw Error("User not found!");
                        }
                        const user = resData.items[0];
                        return fetchFromAWS(`/case/${config.apiRoute}`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                userId: user.user_id,
                                displayName: user.display_name,
                                profileImage: user.profile_image
                            })
                        });
                    }))).then((res => {
                        if (200 === res.status) {
                            return res.json().then((resData => container.replaceWith(buildCaseManagerPane(userId, resData.hasOpenCase))));
                        } else if (409 === res.status) {
                            return res.json().then((resData => {
                                StackExchange.helpers.showToast(resData.message, {
                                    transientTimeout: 1e4,
                                    type: "warning"
                                });
                                return container.replaceWith(buildCaseManagerPane(userId, resData.hasOpenCase));
                            }));
                        }
                        throw Error("Something went wrong");
                    }));
                }
            }));
        }));
        container.append(button);
        return container;
    }
    function buildActionsSummaryPane(postSummary) {
        const container = $('<div class="grid--item p4 s-table-container"></div>');
        const actionTable = $('<table class="s-table"><thead><tr><th scope="col">Post Action</th><th scope="col">Number of Posts</th></tr></thead></table>');
        const actionTableBody = $("<tbody></tbody>");
        postSummary.forEach((post => {
            actionTableBody.append($(`<tr><td>${post.action_taken}</td><td>${post.number_of_posts}</td></tr>`));
        }));
        actionTable.append(actionTableBody);
        container.append(actionTable);
        return container;
    }
    function buildCaseHistoryPane(caseTimeline) {
        const container = $('<div class="grid--item p8"><h3 class="fs-title mb8">Investigation History</h3></div>');
        const timeline = $('<div class="d-flex fd-column g4"></div>');
        caseTimeline.forEach((entry => {
            timeline.append($(`<div class="flex--item d-flex fd-row jc-space-between ai-center" data-timeline-id="${entry.case_event_id}"><a href="/users/${entry.account_id}">${entry.display_name}</a><span data-event-type-id="${entry.case_event_type_id}">${entry.case_event_description}</span><span title="${entry.event_creation_date}">${toStackExchangeDateFormat(entry.event_creation_date)}</span></div>`));
        }));
        container.append(timeline);
        return container;
    }
    const iconAttrMap = {
        1: {
            desc: "Looks OK",
            colourVar: "--green-600",
            svg: buildCheckmarkSvg(16)
        },
        3: {
            desc: "plagiarised",
            colourVar: "--red-600",
            svg: buildCaseSvg(16)
        },
        5: {
            desc: "suspicious",
            colourVar: "--yellow-700",
            svg: buildAlertSvg(16)
        }
    };
    function buildSymbolBar(postId, eventValues) {
        const symbolBar = $('<div class="case-manager-symbol-group d-flex fd-row g2 ba bar-sm p2" style="width:min-content"></div>');
        eventValues.forEach((eventId => {
            if (Object.hasOwn(iconAttrMap, eventId)) {
                const {desc: desc, colourVar: colourVar, svg: svg} = iconAttrMap[eventId];
                symbolBar.append($(`<div title="This post is noted in the Case Manager System as ${desc}" class="flex--item s-post-summary--stats-item" style="color: var(${colourVar})">${svg}</div>`));
            }
        }));
        return symbolBar;
    }
    function getAnswerIdsOnAnswerPage() {
        return new Set($(".s-post-summary").map(((i, e) => e.getAttribute("data-post-id"))).toArray());
    }
    function renderAnswerSummaryIndicators(summaryPostActions) {
        Object.entries(summaryPostActions).forEach((([postId, eventValues]) => {
            $(`#answer-id-${postId} .s-post-summary--stats-item:eq(0)`).before(buildSymbolBar(postId, eventValues));
        }));
    }
    function addSummaryActionIndicators() {
        const postIdsOnPage = getAnswerIdsOnAnswerPage();
        getSummaryPostActionsFromIds([ ...postIdsOnPage ]).then(renderAnswerSummaryIndicators);
    }
    function buildAnswerSummaryIndicator() {
        addSummaryActionIndicators();
        const matchPattern = new RegExp("users/tab/\\d+\\?tab=answers", "gi");
        $(document).on("ajaxComplete", ((_0, _1, {url: url}) => {
            if (url.match(matchPattern)) {
                addSummaryActionIndicators();
            }
        }));
    }
    function getAnswerIdsOnFlagPage() {
        return new Set($(".flagged-post .answer-link a").map(((i, e) => {
            const href = e.getAttribute("href");
            if (null === href || !href.includes("#")) {
                return;
            }
            return href.split("#").at(-1);
        })).toArray());
    }
    function renderFlagSummaryIndicators(summaryPostActions) {
        Object.entries(summaryPostActions).forEach((([postId, eventValues]) => {
            const a = $(`a[href$="#${postId}"`);
            a.parent(".answer-link").addClass("d-flex fd-row ai-center g6");
            a.before(buildSymbolBar(postId, eventValues));
        }));
    }
    function addSummaryActionIndicatorsOnFlagPage() {
        const postIdsOnPage = getAnswerIdsOnFlagPage();
        getSummaryPostActionsFromIds([ ...postIdsOnPage ]).then(renderFlagSummaryIndicators);
    }
    function buildFlagSummaryIndicator() {
        addSummaryActionIndicatorsOnFlagPage();
    }
    function buildProfilePage() {
        if (null !== window.location.pathname.match(/^\/users\/flagged-posts\/.*/) || null !== window.location.pathname.match(/^\/users\/flag-summary\/.*/)) {
            buildFlagSummaryIndicator();
            return;
        }
        const userId = getUserIdFromWindowLocation();
        const {tabContainer: tabContainer, navButton: navButton} = buildNavToCaseManager(userId);
        if (window.location.search.startsWith("?tab=case-manager")) {
            markNavToCaseManagerActive(tabContainer, navButton);
            buildAndAttachCaseManagerControlPanel(userId);
        } else if (window.location.search.startsWith("?tab=answers")) {
            buildAnswerSummaryIndicator();
        }
    }
    function getUserIdFromWindowLocation() {
        const patternMatcher = window.location.pathname.match(/^\/users\/(account-info\/)?\d+/g);
        if (null === patternMatcher || 1 !== patternMatcher.length) {
            throw Error("Something changed in user path!");
        }
        return Number(patternMatcher[0].split("/").at(-1));
    }
    function markNavToCaseManagerActive(tabContainer, navButton) {
        const selectedClass = "is-selected";
        tabContainer.find("a").removeClass(selectedClass);
        navButton.addClass(selectedClass);
    }
    function buildNavToCaseManager(userId) {
        const navButton = $(`<a href="/users/${userId}/?tab=case-manager" class="s-navigation--item">Case Manager</a>`);
        fetchFromAWS(`/case/user/${userId}`).then((res => res.json())).then((resData => {
            if (resData.is_known_user) {
                navButton.prepend(buildAlertSvg(16, 20));
            }
        }));
        const tabContainer = $(".user-show-new .s-navigation:eq(0)");
        tabContainer.append(navButton);
        return {
            tabContainer: tabContainer,
            navButton: navButton
        };
    }
    function buildUserTile(account_id, profile_image, display_name, number_of_plagiarised_posts, current_state, event_date) {
        const link = `/users/${account_id}?tab=case-manager`;
        return $(`<div class="grid--item user-info">\n${null !== profile_image ? `<div class="user-gravatar48">\n<a href="${link}"><div class="gravatar-wrapper-48"><img src="${profile_image}" alt="${display_name}'s user avatar" width="48" height="48" class="bar-sm"></div></a>\n</div>` : ""}\n<div class="user-details">\n<a href="${link}">${display_name}</a>\n<div class="-flair">\n<span title="the number of posts marked as plagiairsm for this user" dir="ltr">${number_of_plagiarised_posts} Plagiarised posts</span>\n</div>\n<div class="d-flex fd-column mt6">\n<span>Case ${current_state} on</span>\n<span title="${event_date}">${toStackExchangeDateFormat(event_date)}</span>\n</div>\n</div>\n</div>`);
    }
    class CasesUserList {
        needsTotalPages;
        needsGroupInfo;
        currentPage;
        group;
        search;
        searchTimeout;
        userData;
        totalPages;
        groupInfo;
        constructor() {
            this.needsTotalPages = true;
            this.needsGroupInfo = true;
            this.currentPage = 1;
            this.totalPages = 1;
            this.group = "1";
            this.userData = [];
            this.search = "";
            this.groupInfo = [];
        }
        setCurrentPage() {
            const usp = new URLSearchParams(window.location.search);
            if (usp.has("page")) {
                this.currentPage = Number(usp.get("page"));
            }
            if (usp.has("group")) {
                this.group = usp.get("group");
            }
            if (usp.has("search")) {
                this.search = usp.get("search");
            }
        }
        buildUsersURLWithParams(p) {
            const usp = new URLSearchParams("?tab=case");
            usp.set("group", this.group);
            usp.set("page", (void 0 === p ? this.currentPage : p).toString());
            if (this.search.length > 0) {
                usp.set("search", this.search);
            }
            return `/users?${usp.toString()}`;
        }
        pullDownData() {
            const usp = new URLSearchParams;
            usp.set("group", this.group);
            usp.set("page", this.currentPage.toString());
            if (this.search.length > 0) {
                usp.set("search", this.search);
            }
            if (this.needsTotalPages) {
                usp.set("total-pages", "true");
            }
            if (this.needsGroupInfo) {
                usp.set("group-info", "true");
            }
            return fetchFromAWS(`/cases?${usp.toString()}`).then((res => res.json())).then((resData => {
                this.totalPages = resData.totalPages || this.totalPages;
                this.groupInfo = resData.groupInfo || this.groupInfo;
                this.userData = resData.cases;
            }));
        }
        pullDownAndRender() {
            return this.pullDownData().then((() => {
                this.render();
            }));
        }
        init() {
            this.setCurrentPage();
            const searchInput = $('<input id="userfilter" name="userfilter" class="s-input s-input__search h100 wmx3" autocomplete="off" type="text" placeholder="Filter by user">');
            if (this.search.length > 0) {
                searchInput.val(this.search);
            }
            searchInput.on("input", (ev => {
                clearTimeout(this.searchTimeout);
                if (this.search !== ev.target.value) {
                    this.search = ev.target.value;
                    this.searchTimeout = setTimeout((() => {
                        this.currentPage = 1;
                        this.needsTotalPages = true;
                        window.history.pushState("search_paging", "", this.buildUsersURLWithParams());
                        this.pullDownAndRender();
                    }), 450);
                }
            }));
            $("#mainbar-full").empty().append($('<h1 class="fs-headline1 mb24">Plagiarists</h1>')).append($('<div class="d-flex fw-wrap ai-stretch md:d-block"></div>').append($('<div class="flex--item mb12 ps-relative"></div>').append(searchInput).append($(buildSearchSvg()))).append($('<div class="flex--item ml-auto mb12 h100 d-flex s-btn-group js-filter-btn">\n<a class="js-sort-preference-change flex--item s-btn s-btn__muted s-btn__outlined" href="/users?tab=reputation"\ndata-nav-xhref="" title="Users with the highest reputation scores" data-value="reputation" data-shortcut=""\naria-current="page"> Reputation</a>\n<a class="js-sort-preference-change flex--item s-btn s-btn__muted s-btn__outlined" href="/users?tab=newusers"\ndata-nav-xhref="" title="Users who joined in the last 30 days" data-value="newusers" data-shortcut=""> New\nusers</a>\n<a class="js-sort-preference-change flex--item s-btn s-btn__muted s-btn__outlined" href="/users?tab=voters"\ndata-nav-xhref="" title="Users who voted more than 10 times" data-value="voters" data-shortcut=""> Voters</a>\n<a class="js-sort-preference-change flex--item s-btn s-btn__muted s-btn__outlined" href="/users?tab=editors"\ndata-nav-xhref="" title="Users who edited at least 5 posts" data-value="editors" data-shortcut=""> Editors</a>\n<a class="js-sort-preference-change flex--item s-btn s-btn__muted s-btn__outlined" href="/users?tab=moderators"\ndata-nav-xhref="" title="Our current community moderators" data-value="moderators" data-shortcut="">\nModerators</a>\n<a class="js-sort-preference-change youarehere is-selected flex--item s-btn s-btn__muted s-btn__outlined" href="/users?tab=case"\ndata-nav-xhref="" title="Users who have been or are currently under investigation" data-value="plagiarist"\ndata-shortcut="">Plagiarists</a>\n</div>'))).append($('<div class="fs-body2 mt8 mb12"><div class="d-flex jc-space-between"><div class="flex--item ml-auto md:ml0"><div id="tabs-interval" class="subtabs d-flex"></div></div></div></div>')).append($('<div id="user-browser" class="d-grid grid__4 lg:grid__3 md:grid__2 sm:grid__1 g12"></div>')).append($('<div id="user-pagination" class="s-pagination site1 themed pager float-right"></div>'));
            this.pullDownData().then((() => {
                this.needsTotalPages = false;
                this.needsGroupInfo = false;
                this.render();
            }));
            window.addEventListener("popstate", (() => {
                this.setCurrentPage();
                this.pullDownAndRender();
            }));
        }
        buildGroupToggleLink(group_id, description) {
            const usp = new URLSearchParams("?tab=case");
            usp.set("group", group_id);
            if (this.search.length > 0) {
                usp.set("search", this.search);
            }
            const href = `/users?${usp.toString()}`;
            const a = $(`<a${group_id === this.group ? ' class="youarehere is-selected"' : ""} href="${href}" data-nav-xhref="" data-value="${group_id}" data-shortcut="">${description}</a>`);
            a.on("click", (ev => {
                ev.preventDefault();
                if (this.group !== group_id) {
                    window.history.pushState("group_paging", "", href);
                    this.group = group_id;
                    this.currentPage = 1;
                    this.needsTotalPages = true;
                    this.pullDownAndRender();
                }
            }));
            return a;
        }
        buildGroupToggle() {
            const mountPoint = $("#tabs-interval").empty();
            this.groupInfo.forEach((entry => {
                mountPoint.append(this.buildGroupToggleLink(entry.group_id, entry.description));
            }));
        }
        buildUserPanel() {
            const mountPoint = $("#user-browser").empty();
            this.userData.forEach((userData => {
                mountPoint.append(buildUserTile(userData.investigated_user_id, userData.profile_image, userData.display_name, userData.number_of_plagiarised_posts, userData.current_state, userData.event_creation_date));
            }));
        }
        buildNavItem(pageNumber, linkLabel) {
            if (void 0 === linkLabel) {
                linkLabel = pageNumber;
            }
            const href = this.buildUsersURLWithParams(pageNumber);
            const a = $(`<a class="s-pagination--item" href="${href}">${linkLabel}</a>`);
            a.on("click", (ev => {
                ev.preventDefault();
                window.history.pushState("paging", "", href);
                this.currentPage = pageNumber;
                this.pullDownAndRender();
            }));
            return a;
        }
        buildPagination() {
            const mountPoint = $("#user-pagination").empty();
            if (1 === this.totalPages) {
                return;
            }
            const buildPagesFromRange = p => {
                const pageNumber = p + 1;
                if (pageNumber === this.currentPage) {
                    mountPoint.append(`<span class="s-pagination--item is-selected" aria-current="page">${pageNumber}</span>`);
                } else {
                    mountPoint.append(this.buildNavItem(pageNumber));
                }
            };
            if (1 !== this.currentPage) {
                mountPoint.append(this.buildNavItem(this.currentPage - 1, "Prev"));
            }
            const maxVisibleElements = 5;
            if (this.totalPages <= maxVisibleElements + 2) {
                [ ...Array(this.totalPages).keys() ].forEach(buildPagesFromRange);
            } else {
                if (this.currentPage - maxVisibleElements >= 0) {
                    mountPoint.append(this.buildNavItem(1));
                    mountPoint.append('<span class="s-pagination--item s-pagination--item__clear">…</span>');
                }
                if (this.currentPage < maxVisibleElements) {
                    [ ...Array(maxVisibleElements).keys() ].forEach(buildPagesFromRange);
                } else if (this.currentPage > this.totalPages - maxVisibleElements) {
                    [ ...Array(maxVisibleElements).keys() ].forEach((p => {
                        buildPagesFromRange(this.totalPages - maxVisibleElements + p);
                    }));
                } else {
                    [ ...Array(maxVisibleElements).keys() ].forEach((p => {
                        buildPagesFromRange(this.currentPage - Math.ceil(maxVisibleElements / 2) + p);
                    }));
                }
                if (this.totalPages - this.currentPage >= maxVisibleElements) {
                    mountPoint.append('<span class="s-pagination--item s-pagination--item__clear">…</span>');
                    mountPoint.append(this.buildNavItem(this.totalPages));
                }
            }
            if (this.currentPage !== this.totalPages) {
                mountPoint.append(this.buildNavItem(this.currentPage + 1, "Next"));
            }
        }
        render() {
            this.buildGroupToggle();
            this.buildUserPanel();
            this.buildPagination();
        }
    }
    function buildPlagiaristTab() {
        $(".js-filter-btn").append($('<a class="js-sort-preference-change flex--item s-btn s-btn__muted s-btn__outlined" href="/users?tab=case" data-nav-xhref="" title="Users who have been or are currently under investigation" data-value="plagiarist" data-shortcut="">Plagiarists</a>'));
        if (window.location.search.startsWith("?tab=case")) {
            (new CasesUserList).init();
        }
    }
    function UserScript() {
        if (null === GM_getValue(accessToken, null)) {
            buildClientSideAuthModal();
            return;
        }
        if (null !== window.location.pathname.match(/^\/questions\/.*/)) {
            buildAnswerControlPanel();
        } else if (null !== window.location.pathname.match(/^\/users$/)) {
            buildPlagiaristTab();
        } else if (null !== window.location.pathname.match(new RegExp(`^/users/(account-info/)?${StackExchange.options.user.userId}.*`))) {
            buildUserScriptSettingsNav();
        } else if (null !== window.location.pathname.match(/^\/users\/.*/)) {
            buildProfilePage();
        }
    }
    StackExchange.ready((() => {
        UserScript();
    }));
})();
