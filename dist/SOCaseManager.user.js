// ==UserScript==
// @name        SO Plagiarism Case Manager
// @description Help facilitate and track collaborative plagiarism cleanup efforts
// @homepage    https://github.com/HenryEcker/SOCaseManagerUserScript
// @author      Henry Ecker (https://github.com/HenryEcker)
// @version     0.2.5
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
// @exclude     *://stackoverflow.com/users/flag-summary/*
// @exclude     *://stackoverflow.com/users/hidecommunities/*
// @exclude     *://stackoverflow.com/users/message/*
// @exclude     *://stackoverflow.com/users/my-collectives/*
// @exclude     *://stackoverflow.com/users/mylogins/*
// @exclude     *://stackoverflow.com/users/preferences/*
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
        detailText: "",
        flag: false,
        comment: true,
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
            } else {
                return res;
            }
        }));
    }
    function getSummaryPostInfoFromIds(ids) {
        if (ids.length <= 0) {
            return Promise.resolve(new Set);
        } else {
            return fetchFromAWS(`/summary/posts/${ids.join(";")}`).then((res => res.json())).then((postIds => Promise.resolve(new Set(postIds))));
        }
    }
    function getSummaryPostActionsFromIds(ids) {
        if (ids.length <= 0) {
            return Promise.resolve({});
        } else {
            return fetchFromAWS(`/summary/posts/${ids.join(";")}/actions`).then((res => res.json())).then((postActionData => Promise.resolve(postActionData)));
        }
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
    const popoverMountPointClass = "popover-mount-point";
    function getTimelineButtonId(answerId) {
        return `${answerId}-timeline-indicator-button`;
    }
    function getTimelinePopoverId(answerId) {
        return `case-manager-timeline-popover-${answerId}`;
    }
    function getActionsPopoverId(answerId) {
        return `case-manager-answer-popover-${answerId}`;
    }
    function getModMenuPopoverId(answerId) {
        return `case-manager-mod-menu-popover-${answerId}`;
    }
    function buildModTools(isDeleted, answerId, postOwnerId) {
        const baseId = getModMenuPopoverId(answerId);
        const button = $(`<button ${isDeleted ? "disabled" : ""} class="ml-auto s-btn s-btn__danger s-btn__outlined s-btn__dropdown" type="button" aria-controls="${baseId}" aria-expanded="false" data-controller="s-popover" data-action="s-popover#toggle" data-s-popover-placement="top-end" data-s-popover-toggle-class="is-selected">Nuke as plagiarism</button>`);
        if (isDeleted) {
            return button;
        } else {
            return $(document.createDocumentFragment()).append(button).append(buildPopOver(baseId, answerId, postOwnerId));
        }
    }
    function buildPopOver(baseId, answerId, postOwnerId) {
        const nukePostConfig = JSON.parse(GM_getValue(nukePostOptions, nukePostDefaultConfigString));
        const {textareaLabel: textareaLabel, textarea: textarea, checkboxContainer: checkboxContainer, shouldFlagCheckbox: shouldFlagCheckbox, shouldCommentCheckbox: shouldCommentCheckbox, shouldLogCheckbox: shouldLogCheckbox} = buildNukeOptionElements(baseId, nukePostConfig);
        const lengthSpan = $(`<span>${nukePostConfig.detailText.length}</span>`);
        const nukeButton = $('<button title="Deletes the post, adds a comment, and logs feedback in Case Manager" class="flex--item h32 s-btn s-btn__danger s-btn__outlined s-btn__xs">Nuke</button>');
        nukeButton.on("click", (ev => {
            ev.preventDefault();
            const [isFlagChecked, isCommentChecked, isLogChecked] = getCheckboxValuesFromParentContainer(shouldFlagCheckbox, shouldCommentCheckbox, shouldLogCheckbox);
            nukePostAsPlagiarism(answerId, postOwnerId, textarea.val(), isFlagChecked, isCommentChecked, isLogChecked);
        }));
        function updateDisplayBasedOnSelections(ev) {
            ev.preventDefault();
            const [isFlagChecked, isCommentChecked, isLogChecked] = getCheckboxValuesFromParentContainer(shouldFlagCheckbox, shouldCommentCheckbox, shouldLogCheckbox);
            if (!isFlagChecked && !isCommentChecked) {
                textarea.prop("disabled", true);
            } else {
                textarea.removeProp("disabled");
            }
            nukeButton.attr("title", (isFlagChecked ? "Flags the post, " : "") + (isFlagChecked ? "deletes" : "Deletes") + " the post" + (isCommentChecked ? ", adds a comment" : "") + (isLogChecked ? ", logs feedback in Case manager" : ""));
        }
        shouldCommentCheckbox.find('input[type="checkbox"]').on("input", updateDisplayBasedOnSelections);
        shouldFlagCheckbox.find('input[type="checkbox"]').on("input", updateDisplayBasedOnSelections);
        shouldLogCheckbox.find('input[type="checkbox"]').on("input", updateDisplayBasedOnSelections);
        textarea.on("input", (ev => {
            ev.preventDefault();
            const length = ev.target.value.length;
            lengthSpan.text(length);
        }));
        return $(`<div class="s-popover" id="${baseId}" role="menu" style="max-width: min-content"><div class="s-popover--arrow"/></div>`).append($('<div class="d-grid g8 ai-center grid__1 ws4"></div>').append($('<div class="d-flex fd-row jc-space-between"></div>').append(textareaLabel).append('<a class="fs-fine" href="/users/current?tab=case-manager-settings" target="_blank">Configure default options</a>')).append(textarea).append($("<div></div>").append("<span>Characters: </span>").append(lengthSpan)).append($('<div class="d-flex fd-row flex__fl-equal g8"></div>').append(checkboxContainer).append(nukeButton)));
    }
    function getCheckboxValuesFromParentContainer(...wrappedCheckboxes) {
        return wrappedCheckboxes.map(hasCheckedChild);
    }
    function hasCheckedChild(e) {
        return e.find('input[type="checkbox"]').is(":checked");
    }
    function buildNukeOptionElements(baseId, nukePostConfig) {
        const textareaLabel = $(`<label class="s-label" for="${baseId}-ta">Detail Text:</label>`);
        const textarea = $(`<textarea id="${baseId}-ta" class="s-textarea js-comment-text-input" rows="5"/>`);
        textarea.val(nukePostConfig.detailText);
        const checkboxContainer = $('<div class="flex--item d-flex fd-column g8"></div>');
        const shouldFlagCheckbox = $(`<div class="s-check-control"><input class="s-checkbox" type="checkbox" name="flag" id="${baseId}-cb-flag"${nukePostConfig.flag ? " checked" : ""}/><label class="s-label" for="${baseId}-cb-flag">Flag</label></div>`);
        const shouldCommentCheckbox = $(`<div class="s-check-control"><input class="s-checkbox" type="checkbox" name="comment" id="${baseId}-cb-comment"${nukePostConfig.comment ? " checked" : ""}/><label class="s-label" for="${baseId}-cb-comment">Comment</label></div>`);
        const shouldLogCheckbox = $(`<div class="s-check-control"><input class="s-checkbox" type="checkbox" name="log" id="${baseId}-cb-log"${nukePostConfig.log ? " checked" : ""}/><label class="s-label" for="${baseId}-cb-log">Log</label></div>`);
        checkboxContainer.append(shouldFlagCheckbox).append(shouldCommentCheckbox).append(shouldLogCheckbox);
        return {
            textareaLabel: textareaLabel,
            textarea: textarea,
            checkboxContainer: checkboxContainer,
            shouldFlagCheckbox: shouldFlagCheckbox,
            shouldCommentCheckbox: shouldCommentCheckbox,
            shouldLogCheckbox: shouldLogCheckbox
        };
    }
    async function nukePostAsPlagiarism(answerId, ownerId, message, flagPost = false, commentPost = true, logWithAws = true) {
        if (flagPost && (message.length < 10 || message.length > 500)) {
            StackExchange.helpers.showToast("Flags must be between 10 and 500 characters. Either add text or disable the flagging option.", {
                type: "danger"
            });
            return;
        }
        if (commentPost && (message.length < 15 || message.length > 600)) {
            StackExchange.helpers.showToast("Comments must be between 10 and 600 characters. Either add text or disable the comment option.", {
                type: "danger"
            });
            return;
        }
        if (flagPost) {
            const flagFd = new FormData;
            flagFd.set("fkey", StackExchange.options.user.fkey);
            flagFd.set("otherText", message);
            const flagFetch = await fetch(`/flags/posts/${answerId}/add/PostOther`, {
                body: flagFd,
                method: "POST"
            }).then((res => res.json()));
            if (!flagFetch.Success) {
                StackExchange.helpers.showToast(flagFetch.Message);
                return;
            }
        }
        const deleteFd = new FormData;
        deleteFd.set("fkey", StackExchange.options.user.fkey);
        const deleteFetch = await fetch(`/posts/${answerId}/vote/10`, {
            body: deleteFd,
            method: "POST"
        }).then((res => res.json()));
        if (deleteFetch.Success) {
            if (commentPost) {
                const commentFd = new FormData;
                commentFd.set("fkey", StackExchange.options.user.fkey);
                commentFd.set("comment", message);
                await void fetch(`/posts/${answerId}/comments`, {
                    body: commentFd,
                    method: "POST"
                });
            }
            if (logWithAws) {
                const body = {};
                if (-1 !== ownerId) {
                    body.postOwnerId = ownerId;
                }
                body.actionIds = [ 3, 4 ];
                await fetchFromAWS(`/handle/post/${answerId}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(body)
                });
            }
            window.location.reload();
        }
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
    function buildEditPenSvg(dim = 18, viewBox = 18) {
        return `<svg aria-hidden="true" class="svg-icon iconPencil" width="${dim}" height="${dim}" viewBox="0 0 ${viewBox} ${viewBox}"><path d="m13.68 2.15 2.17 2.17c.2.2.2.51 0 .71L14.5 6.39l-2.88-2.88 1.35-1.36c.2-.2.51-.2.71 0ZM2 13.13l8.5-8.5 2.88 2.88-8.5 8.5H2v-2.88Z"></path></svg>`;
    }
    function buildSearchSvg(dim = 18, viewBox = 18) {
        return `<svg aria-hidden="true" class="s-input-icon s-input-icon__search svg-icon iconSearch" width="${dim}" height="${dim}" viewBox="0 0 ${viewBox} ${viewBox}"><path d="m18 16.5-5.14-5.18h-.35a7 7 0 1 0-1.19 1.19v.35L16.5 18l1.5-1.5ZM12 7A5 5 0 1 1 2 7a5 5 0 0 1 10 0Z"></path></svg>`;
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
        const timelineButton = $(`<button title="Click to view a record of actions taken on this post." id="${buttonId}" class="flex--item s-btn s-btn__danger s-btn__icon ws-nowrap s-btn__dropdown" role="button" aria-controls="${timelinePopoverId}" aria-expanded="false" data-controller="s-popover" data-action="s-popover#toggle" data-s-popover-placement="top-start" data-s-popover-toggle-class="is-selected">${buildAlertSvg()}<span class="px8">Post Timeline</span></button>`);
        timelineButton.on("click", (ev => {
            ev.preventDefault();
            if ("true" !== timelineButton.attr("timeline-loaded")) {
                fetchFromAWS(`/timeline/post/${answerId}`).then((res => res.json())).then((timelineEvents => {
                    const eventPane = $('<div class="case-manager-post-timeline-container"></div>');
                    eventPane.append($("<h3>Case Manager Post Timeline</h3>"));
                    const timelineEventContainer = $('<div class="d-grid ws-nowrap" style="grid-template-columns: repeat(3, min-content); grid-gap: var(--su8);"></div>');
                    for (const event of timelineEvents) {
                        timelineEventContainer.append($(`<a href="/users/${event.account_id}">${event.display_name}</a><span data-event-type-id="${event.timeline_event_type}">${event.timeline_event_description}</span><span>${new Date(event.event_creation_date).toLocaleString()}</span>`));
                    }
                    eventPane.append(timelineEventContainer);
                    $(`#${timelinePopoverId} > .${popoverMountPointClass}`).empty().append(eventPane);
                    timelineButton.attr("timeline-loaded", "true");
                }));
            }
        }));
        return timelineButton;
    }
    function buildActionsComponent(answerId, ownerId) {
        const controlButton = $(`<button title="Click to record an action you have taken on this post." class="s-btn s-btn__dropdown" role="button" aria-controls="${getActionsPopoverId(answerId)}" aria-expanded="false" data-controller="s-popover" data-action="s-popover#toggle" data-s-popover-placement="top-end" data-s-popover-toggle-class="is-selected">Record Post Action</button>`);
        const popOver = $(`<div class="s-popover" id="${getActionsPopoverId(answerId)}" role="menu"><div class="s-popover--arrow"/><div class="${popoverMountPointClass}"><div class="is-loading">Loading…</div></div></div>`);
        controlButton.on("click", (ev => {
            ev.preventDefault();
            if ("true" !== controlButton.attr("options-loaded")) {
                fetchFromAWS(`/handle/post/${answerId}`).then((res => res.json())).then((actions => {
                    buildActionsComponentFromActions(answerId, ownerId, actions);
                    controlButton.attr("options-loaded", "true");
                }));
            }
        }));
        return $(document.createDocumentFragment()).append(controlButton).append(popOver);
    }
    function buildActionsComponentFromActions(answerId, ownerId, actions) {
        const popOverInnerContainer = $('<div class="case-manager-post-action-container"><h3>Case Manager Post Action Panel</h3></div>');
        const actionsForm = $('<form class="d-grid grid__1 g6" style="grid-auto-rows: 1fr"></form>');
        for (const action of actions) {
            const actionRow = $('<div class="grid--item d-flex fd-row jc-space-between ai-center"></div>');
            const checkboxId = getActionCheckboxId(answerId, action.action_id);
            const checkbox = $(`<div class="d-flex g8"><div class="flex--item"><input class="s-checkbox" type="checkbox" name="${action.action_description}" data-action-id="${action.action_id}" id="${checkboxId}" ${action.user_acted ? "checked disabled" : ""}/></div><label class="flex--item s-label fw-normal" for="${checkboxId}">${action.action_description}</label></div>`);
            actionRow.append(checkbox);
            if (action.user_acted) {
                const clearButton = $('<button class="s-btn s-btn__danger" type="button">Clear</button>');
                clearButton.on("click", clearMyActionHandler(action, answerId, checkboxId, clearButton));
                actionRow.append(clearButton);
            }
            actionsForm.append(actionRow);
        }
        actionsForm.append($('<div class="d-flex fd-row jc-start"><button class="s-btn s-btn__primary" type="submit">Save</button><button class="s-btn" type="reset">Reset</button></div>'));
        actionsForm.on("submit", handleFormAction(actionsForm, answerId, ownerId));
        popOverInnerContainer.append(actionsForm);
        $(`#${getActionsPopoverId(answerId)} > .${popoverMountPointClass}`).empty().append(popOverInnerContainer);
    }
    function getActionCheckboxId(answerId, action_id) {
        return `checkbox-${answerId}-${action_id}`;
    }
    function clearMyActionHandler(action, answerId, checkboxId, clearButton) {
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
                            $(`#${checkboxId}`).prop("checked", false).prop("disabled", false);
                            clearButton.remove();
                            $(`#${getTimelineButtonId(answerId)}`).attr("timeline-loaded", "false");
                        }
                    }));
                }
            }));
        };
    }
    function handleFormAction(form, answerId, ownerId) {
        return ev => {
            ev.preventDefault();
            const submitButton = form.find('button[type="submit"]');
            submitButton.prop("disabled", true);
            const actions = form.find('input[type="checkbox"]:checked:not(:disabled)');
            if (0 === actions.length) {
                submitButton.prop("disabled", false);
                return;
            }
            const body = {};
            if (-1 !== ownerId) {
                body.postOwnerId = ownerId;
            }
            body.actionIds = actions.map(((i, e) => {
                const id = $(e).attr("data-action-id");
                if (void 0 !== id) {
                    return Number(id);
                }
            })).toArray();
            fetchFromAWS(`/handle/post/${answerId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            }).then((res => res.json())).then((actions2 => {
                activateTimelineButton(answerId);
                buildActionsComponentFromActions(answerId, ownerId, actions2);
            })).catch((() => {
                submitButton.prop("disabled", false);
            }));
        };
    }
    function buildAnswerControlPanel() {
        const answers = $("div.answer");
        const answerIds = answers.map(((i, e) => getAnswerIdFromAnswerDiv(e))).toArray();
        for (const {jAnswer: jAnswer, isDeleted: isDeleted, answerId: answerId, postOwnerId: postOwnerId} of extractFromAnswerDivs(answers, answerIds)) {
            const controlPanel = $('<div class="p8 g8 d-flex fd-row jc-space-between ai-center"></div>');
            controlPanel.append(buildBaseTimelineButtons(answerId));
            if (StackExchange.options.user.isModerator) {
                controlPanel.append(buildModTools(isDeleted, answerId, postOwnerId));
            }
            controlPanel.append(buildActionsComponent(answerId, postOwnerId));
            jAnswer.append(controlPanel);
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
            if (void 0 !== answerId && postOwnerId !== StackExchange.options.user.userId) {
                yield {
                    jAnswer: jAnswer,
                    isDeleted: isDeleted,
                    answerId: answerId,
                    postOwnerId: postOwnerId
                };
            }
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
        } else {
            return Number(match[1]);
        }
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
    function buildNukeConfigControls() {
        return $("<div></div>").append('<h3 class="fs-title mb12">Edit base options for nuking posts</h3>').append(buildTemplateForm());
    }
    function buildTemplateForm() {
        const nukePostConfig = JSON.parse(GM_getValue(nukePostOptions, nukePostDefaultConfigString));
        const templateForm = $('<form class="d-flex fd-column g8"></form>');
        const {textareaLabel: textareaLabel, textarea: textarea, checkboxContainer: checkboxContainer, shouldFlagCheckbox: shouldFlagCheckbox, shouldCommentCheckbox: shouldCommentCheckbox, shouldLogCheckbox: shouldLogCheckbox} = buildNukeOptionElements("nuke-config", nukePostConfig);
        templateForm.on("submit", (function(ev) {
            ev.preventDefault();
            try {
                const [isFlagChecked, isCommentChecked, isLogChecked] = getCheckboxValuesFromParentContainer(shouldFlagCheckbox, shouldCommentCheckbox, shouldLogCheckbox);
                const newConfig = {
                    detailText: textarea.val() || "",
                    flag: isFlagChecked,
                    comment: isCommentChecked,
                    log: isLogChecked
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
        }));
        return templateForm.append(textareaLabel).append(textarea).append(checkboxContainer).append('<div><button class="s-btn s-btn__primary" type="submit">Save Config</button></div>');
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
            const section = $('<section class="flex--item fl-grow1 wmx100"><div class="s-page-title mb24"><h1 class="s-page-title--header m0 baw0 p0">Post Status Summary</h1></section>');
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
                            const select = $(`<select id="${htmlId}"> ${buildSummaryTableFilterOption("Any", "any", this.postSummaryColumnFilter[index])} ${buildSummaryTableFilterOption("Checked", "checked", this.postSummaryColumnFilter[index])} ${buildSummaryTableFilterOption("Unchecked", "unchecked", this.postSummaryColumnFilter[index])} </select>`);
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
            timeline.append($(`<div class="flex--item d-flex fd-row jc-space-between ai-center" data-timeline-id="${entry.case_event_id}"><a href="/users/${entry.account_id}">${entry.display_name}</a><span data-event-type-id="${entry.case_event_type_id}">${entry.case_event_description}</span><span>${new Date(entry.event_creation_date).toLocaleString()}</span></div>`));
        }));
        container.append(timeline);
        return container;
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
    function getAnswerIdsOnPage() {
        return new Set($(".s-post-summary").map(((i, e) => e.getAttribute("data-post-id"))).toArray());
    }
    function addSummaryActionIndicators() {
        const postIdsOnPage = getAnswerIdsOnPage();
        getSummaryPostActionsFromIds([ ...postIdsOnPage ]).then(renderAnswerSummaryIndicators);
    }
    const iconAttrMap = {
        1: {
            desc: "Looks OK",
            colourVar: "--green-600",
            svg: buildCheckmarkSvg(16)
        },
        2: {
            desc: "edited",
            colourVar: "--green-800",
            svg: buildEditPenSvg(16)
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
        const symbolBar = $('<div class="case-manager-symbol-group d-flex fd-row g2 ba bar-sm p2"></div>');
        eventValues.forEach((eventId => {
            if (Object.hasOwn(iconAttrMap, eventId)) {
                const {desc: desc, colourVar: colourVar, svg: svg} = iconAttrMap[eventId];
                symbolBar.append($(`<div title="This post is noted in the Case Manager System as ${desc}" class="flex--item s-post-summary--stats-item" style="color: var(${colourVar})">${svg}</div>`));
            }
        }));
        return symbolBar;
    }
    function renderAnswerSummaryIndicators(summaryPostActions) {
        Object.entries(summaryPostActions).forEach((([postId, eventValues]) => {
            $(`#answer-id-${postId} .s-post-summary--stats-item:eq(0)`).before(buildSymbolBar(postId, eventValues));
        }));
    }
    function buildProfilePage() {
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
        return $(`<div class="grid--item user-info"> ${null !== profile_image ? `<div class="user-gravatar48"><a href="${link}"><div class="gravatar-wrapper-48"><img src="${profile_image}" alt="${display_name}'s user avatar" width="48" height="48" class="bar-sm"></div></a></div>` : ""} <div class="user-details"><a href="${link}">${display_name}</a><div class="-flair"><span title="the number of posts marked as plagiairsm for this user" dir="ltr">${number_of_plagiarised_posts} Plagiarised posts</span></div><div class="d-flex fd-column mt6"><span>Case ${current_state} on</span><span>${new Date(event_date).toLocaleString()}</span></div></div></div>`);
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
            $("#mainbar-full").empty().append($('<h1 class="fs-headline1 mb24">Plagiarists</h1>')).append($('<div class="d-flex fw-wrap ai-stretch md:d-block"></div>').append($('<div class="flex--item mb12 ps-relative"></div>').append(searchInput).append($(buildSearchSvg()))).append($('<div class="flex--item ml-auto mb12 h100 d-flex s-btn-group js-filter-btn"><a class="js-sort-preference-change flex--item s-btn s-btn__muted s-btn__outlined" href="/users?tab=reputation" data-nav-xhref="" title="Users with the highest reputation scores" data-value="reputation" data-shortcut="" aria-current="page"> Reputation</a><a class="js-sort-preference-change flex--item s-btn s-btn__muted s-btn__outlined" href="/users?tab=newusers" data-nav-xhref="" title="Users who joined in the last 30 days" data-value="newusers" data-shortcut=""> New users</a><a class="js-sort-preference-change flex--item s-btn s-btn__muted s-btn__outlined" href="/users?tab=voters" data-nav-xhref="" title="Users who voted more than 10 times" data-value="voters" data-shortcut=""> Voters</a><a class="js-sort-preference-change flex--item s-btn s-btn__muted s-btn__outlined" href="/users?tab=editors" data-nav-xhref="" title="Users who edited at least 5 posts" data-value="editors" data-shortcut=""> Editors</a><a class="js-sort-preference-change flex--item s-btn s-btn__muted s-btn__outlined" href="/users?tab=moderators" data-nav-xhref="" title="Our current community moderators" data-value="moderators" data-shortcut=""> Moderators</a><a class="js-sort-preference-change youarehere is-selected flex--item s-btn s-btn__muted s-btn__outlined" href="/users?tab=case" data-nav-xhref="" title="Users who have been or are currently under investigation" data-value="plagiarist" data-shortcut="">Plagiarists</a></div>'))).append($('<div class="fs-body2 mt8 mb12"><div class="d-flex jc-space-between"><div class="flex--item ml-auto md:ml0"><div id="tabs-interval" class="subtabs d-flex"></div></div></div></div>')).append($('<div id="user-browser" class="d-grid grid__4 lg:grid__3 md:grid__2 sm:grid__1 g12"></div>')).append($('<div id="user-pagination" class="s-pagination site1 themed pager float-right"></div>'));
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
        if (null !== GM_getValue(accessToken, null)) {
            if (null !== window.location.pathname.match(/^\/questions\/.*/)) {
                buildAnswerControlPanel();
            } else if (null !== window.location.pathname.match(/^\/users$/)) {
                buildPlagiaristTab();
            } else if (null !== window.location.pathname.match(new RegExp(`^/users/(account-info/)?${StackExchange.options.user.userId}.*`))) {
                buildUserScriptSettingsNav();
            } else if (null !== window.location.pathname.match(/^\/users\/.*/)) {
                buildProfilePage();
            }
        } else {
            buildClientSideAuthModal();
        }
    }
    StackExchange.ready((() => {
        UserScript();
    }));
})();
