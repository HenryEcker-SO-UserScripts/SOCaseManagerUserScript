// ==UserScript==
// @name        SO Plagiarism Case Manager
// @description Help facilitate and track collaborative plagiarism cleanup efforts
// @homepage    https://github.com/HenryEcker/SOCaseManagerUserScript
// @author      Henry Ecker (https://github.com/HenryEcker)
// @version     0.0.11
// @downloadURL https://github.com/HenryEcker/SOCaseManagerUserScript/raw/master/dist/SOCaseManager.user.js
// @updateURL   https://github.com/HenryEcker/SOCaseManagerUserScript/raw/master/dist/SOCaseManager.user.js
// @match       *://stackoverflow.com/questions/*
// @match       *://stackoverflow.com/users/*
// @match       *://stackoverflow.com/users
// @match       *://stackoverflow.com/users?*
// @exclude     *://stackoverflow.com/users/edit/*
// @exclude     *://stackoverflow.com/users/delete/*
// @exclude     *://stackoverflow.com/users/email/*
// @exclude     *://stackoverflow.com/users/tag-notifications/*
// @exclude     *://stackoverflow.com/users/preferences/*
// @exclude     *://stackoverflow.com/users/hidecommunities/*
// @exclude     *://stackoverflow.com/users/my-collectives/*
// @exclude     *://stackoverflow.com/users/teams/*
// @exclude     *://stackoverflow.com/users/mylogins/*
// @exclude     *://stackoverflow.com/users/apps/*
// @exclude     *://stackoverflow.com/users/flag-summary/*
// @exclude     *://stackoverflow.com/users/message/*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// ==/UserScript==
/* globals $, StackExchange */

/******/ (function() { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};

;// CONCATENATED MODULE: ./src/Globals.ts
const buildAlertSvg = (dim = 18, viewBox = 18) => `<svg aria-hidden="true" class="svg-icon iconAlert" width="${dim}" height="${dim}" viewBox="0 0 ${viewBox} ${viewBox}"><path d="M7.95 2.71c.58-.94 1.52-.94 2.1 0l7.69 12.58c.58.94.15 1.71-.96 1.71H1.22C.1 17-.32 16.23.26 15.29L7.95 2.71ZM8 6v5h2V6H8Zm0 7v2h2v-2H8Z"></path></svg>`;
const buildCaseSvg = (dim = 18, viewBox = 18) => `<svg aria-hidden="true" class="svg-icon iconBriefcase" width="${dim}" height="${dim}" viewBox="0 0 ${viewBox} ${viewBox}"><path d="M5 4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7c0-1.1.9-2 2-2h1V4Zm7 0H6v1h6V4Z"></path></svg>`;
const accessTokenGmStorageKey = 'access_token';
const seApiTokenGmStorageKey = 'se_api_token';
const userCaseManagerTabIdentifier = '?tab=case-manager';
const userCaseManagerSettingsTabIdentifier = '?tab=case-manager-settings';
const userAnswerTabProfile = '?tab=answers';
const casesTab = '?tab=case';
const authRedirectUri = 'https://4shuk8vsp8.execute-api.us-east-1.amazonaws.com/prod/auth/se/oauth';
const seTokenAuthRoute = `https://stackoverflow.com/oauth?client_id=24380&scope=no_expiry&redirect_uri=${authRedirectUri}`;

;// CONCATENATED MODULE: ./src/AWSAPI.ts

const requestNewJwt = () => {
    return fetchFromAWS('/auth/cm/jwt', {
        'method': 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 'se_api_token': GM_getValue(seApiTokenGmStorageKey) })
    }, false)
        .then(res => res.json())
        .then(resData => {
        GM_setValue(accessTokenGmStorageKey, resData['cm_access_token']);
    })
        .catch(err => {
        GM_deleteValue(accessTokenGmStorageKey);
        console.error(err);
    });
};
const fetchFromAWS = (path, options, withCredentials = true) => {
    let newOptions = withCredentials ? {
        'headers': {
            'access_token': GM_getValue(accessTokenGmStorageKey)
        }
    } : {};
    if (options !== undefined) {
        newOptions = {
            ...options,
            'headers': {
                ...options['headers'],
                ...newOptions['headers']
            }
        };
    }
    return fetch(`https://4shuk8vsp8.execute-api.us-east-1.amazonaws.com/prod${path}`, newOptions).then(res => {
        if (res.status === 401) {
            return requestNewJwt().then(() => fetchFromAWS(path, options));
        }
        return res;
    });
};
const getSummaryPostInfoFromIds = (ids) => {
    return fetchFromAWS(`/summary/posts/${ids.join(';')}`)
        .then(res => res.json())
        .then(postIds => {
        return Promise.resolve(new Set(postIds));
    });
};

;// CONCATENATED MODULE: ./src/Scripts/AnswerControlPanel.ts


const popoverMountPointClass = 'popover-mount-point';
const getActionsPopoverId = (answerId) => {
    return `case-manager-answer-popover-${answerId}`;
};
const getActionCheckboxId = (answerId, action_id) => {
    return `checkbox-${answerId}-${action_id}`;
};
const clearMyActionHandler = (action, answerId, checkboxId, clearButton) => (ev) => {
    ev.preventDefault();
    void StackExchange.helpers.showConfirmModal({
        title: 'Remove your action',
        bodyHtml: `<span>Are you sure you want to remove your "${action['action_description']}" action from this post?</span>`,
        buttonLabel: 'Remove Action',
    }).then((confirm) => {
        if (confirm) {
            void fetchFromAWS(`/handle/post/${answerId}/${action['action_id']}`, { 'method': 'DELETE' }).then(res => {
                if (res.status === 200) {
                    $(`#${checkboxId}`)
                        .prop('checked', false)
                        .prop('disabled', false);
                    clearButton.remove();
                    $(`#${getTimelineButtonId(answerId)}`).attr('timeline-loaded', 'false');
                }
            });
        }
    });
};
const handleFormAction = (form, answerId, ownerId) => (ev) => {
    ev.preventDefault();
    const submitButton = form.find('button[type="submit"]');
    submitButton.prop('disabled', true);
    const actions = form.find('input[type="checkbox"]:checked:not(:disabled)');
    if (actions.length === 0) {
        return;
    }
    const body = {};
    if (ownerId !== -1) {
        body['postOwnerId'] = ownerId;
    }
    body['actionIds'] = actions.map((i, e) => {
        const id = $(e).attr('data-action-id');
        if (id === undefined) {
            return undefined;
        }
        else {
            return Number(id);
        }
    }).toArray();
    fetchFromAWS(`/handle/post/${answerId}`, {
        'method': 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
    })
        .then(res => res.json())
        .then(actions => {
        activateTimelineButton(answerId);
        buildActionsComponentFromActions(answerId, ownerId, actions);
    })
        .catch(() => {
        submitButton.prop('disabled', false);
    });
};
const buildActionsComponentFromActions = (answerId, ownerId, actions) => {
    const popOverInnerContainer = $('<div class="case-manager-post-action-container"><h3>Case Manager Post Action Panel</h3></div>');
    const actionsForm = $('<form class="d-grid grid__1 g6" style="grid-auto-rows: 1fr"></form>');
    for (const action of actions) {
        const actionRow = $('<div class="grid--item d-flex fd-row jc-space-between ai-center"></div>');
        const checkboxId = getActionCheckboxId(answerId, action['action_id']);
        const checkbox = $(`<div class="d-flex gs8"><div class="flex--item"><input class="s-checkbox" type="checkbox" name="${action['action_description']}" data-action-id="${action['action_id']}" id="${checkboxId}" ${action['user_acted'] ? 'checked disabled' : ''}/></div><label class="flex--item s-label fw-normal" for="${checkboxId}">${action['action_description']}</label></div>`);
        actionRow.append(checkbox);
        if (action['user_acted']) {
            const clearButton = $('<button class="s-btn s-btn__danger" type="button">Clear</button>');
            clearButton.on('click', clearMyActionHandler(action, answerId, checkboxId, clearButton));
            actionRow.append(clearButton);
        }
        actionsForm.append(actionRow);
    }
    actionsForm.append($(`
<div class="d-flex fd-row jc-start">
    <button class="s-btn s-btn__primary" type="submit">Save</button>
    <button class="s-btn" type="reset">Reset</button>
</div>
`));
    actionsForm.on('submit', handleFormAction(actionsForm, answerId, ownerId));
    popOverInnerContainer.append(actionsForm);
    $(`#${getActionsPopoverId(answerId)} > .${popoverMountPointClass}`)
        .empty()
        .append(popOverInnerContainer);
};
const buildActionsComponent = (mountPoint, answerId, ownerId) => {
    const controlButton = $(`<button title="Click to record an action you have taken on this post." class="s-btn s-btn__dropdown" role="button" aria-controls="${getActionsPopoverId(answerId)}" aria-expanded="false" data-controller="s-popover" data-action="s-popover#toggle" data-s-popover-placement="top-end" data-s-popover-toggle-class="is-selected">Record Post Action</button>`);
    const popOver = $(`<div class="s-popover" id="${getActionsPopoverId(answerId)}" role="menu"><div class="s-popover--arrow"/><div class="${popoverMountPointClass}"><div class="is-loading">Loading…</div></div></div>`);
    controlButton.on('click', (ev) => {
        ev.preventDefault();
        if (controlButton.attr('options-loaded') !== 'true') {
            void fetchFromAWS(`/handle/post/${answerId}`)
                .then(res => res.json())
                .then(actions => {
                buildActionsComponentFromActions(answerId, ownerId, actions);
                controlButton.attr('options-loaded', 'true');
            });
        }
    });
    mountPoint.append(controlButton);
    mountPoint.append(popOver);
};
const getTimelineButtonId = (answerId) => {
    return `${answerId}-timeline-indicator-button`;
};
const getTimelinePopoverId = (answerId) => {
    return `case-manager-timeline-popover-${answerId}`;
};
const buildBaseTimelineButtons = (mountPoint, answerId) => {
    const controlButton = $(`<button id="${getTimelineButtonId(answerId)}" class="flex--item s-btn s-btn__danger ws-nowrap" type="button" disabled>Post Timeline</button>`);
    const popOver = $(`<div class="s-popover" id="${getTimelinePopoverId(answerId)}" role="menu"><div class="s-popover--arrow"/><div class="${popoverMountPointClass}"><div class="is-loading">Loading…</div></div></div>`);
    mountPoint.append(controlButton);
    mountPoint.append(popOver);
};
const buildActiveTimelineButton = (buttonId, answerId) => {
    const timelinePopoverId = getTimelinePopoverId(answerId);
    const timelineButton = $(`<button title="Click to view a record of actions taken on this post." id="${buttonId}" class="flex--item s-btn s-btn__danger s-btn__icon ws-nowrap s-btn__dropdown"  role="button" aria-controls="${timelinePopoverId}" aria-expanded="false" data-controller="s-popover" data-action="s-popover#toggle" data-s-popover-placement="top-start" data-s-popover-toggle-class="is-selected">${buildAlertSvg()}<span class="px8">Post Timeline</span></button>`);
    timelineButton.on('click', (ev) => {
        ev.preventDefault();
        if (timelineButton.attr('timeline-loaded') !== 'true') {
            void fetchFromAWS(`/timeline/post/${answerId}`)
                .then(res => res.json())
                .then(timelineEvents => {
                const eventPane = $('<div class="case-manager-post-timeline-container"></div>');
                eventPane.append($('<h3>Case Manager Post Timeline</h3>'));
                const timelineEventContainer = $('<div class="d-flex fd-column gs4"></div>');
                for (const event of timelineEvents) {
                    timelineEventContainer.append($(`<div class="flex--item d-flex fd-row jc-space-between ai-center"><a href="/users/${event['account_id']}">${event['display_name']}</a><span data-event-type-id="${event['timeline_event_type']}">${event['timeline_event_description']}</span><span>${new Date(event['event_creation_date']).toLocaleString()}</span></div>`));
                }
                eventPane.append(timelineEventContainer);
                $(`#${timelinePopoverId} > .${popoverMountPointClass}`)
                    .empty()
                    .append(eventPane);
                timelineButton.attr('timeline-loaded', 'true');
            });
        }
    });
    return timelineButton;
};
const activateTimelineButton = (postId) => {
    const id = getTimelineButtonId(postId);
    $(`#${id}`).replaceWith(buildActiveTimelineButton(id, postId));
};
const delayPullSummaryPostInfo = (answerIds) => {
    getSummaryPostInfoFromIds(answerIds)
        .then(setPostIds => {
        for (const postId of setPostIds) {
            activateTimelineButton(postId);
        }
    })
        .catch(err => {
        console.error(err);
    });
};
const buildAnswerControlPanel = async () => {
    const answers = $('div.answer');
    const answerIds = answers.map((i, e) => Number($(e).attr('data-answerid'))).toArray();
    const ownerIds = answers.find('div[itemprop="author"]').map((i, postAuthor) => {
        const e = $(postAuthor).find('a');
        if (e.length === 0) {
            return -1;
        }
        const href = e.attr('href');
        if (href === undefined) {
            return -1;
        }
        const match = href.match(/\/users\/(\d+)\/.*/);
        if (match === null) {
            return -1;
        }
        return Number(match[1]);
    });
    if (answers.length > 0) {
        for (let i = 0; i < answers.length; i++) {
            const jAnswer = $(answers[i]);
            const answerId = answerIds[i];
            const postOwnerId = ownerIds[i];
            if (answerId === undefined ||
                postOwnerId === StackExchange.options.user.userId) {
                continue;
            }
            const controlPanel = $('<div class="p8 d-flex fd-row jc-space-between ai-center"></div>');
            buildBaseTimelineButtons(controlPanel, answerId);
            buildActionsComponent(controlPanel, answerId, postOwnerId);
            jAnswer.append(controlPanel);
        }
        delayPullSummaryPostInfo(answerIds);
    }
};

;// CONCATENATED MODULE: ./src/ClientSideAuthFlow.ts


const startAuthFlow = () => {
    const authModalId = 'case-manager-client-auth-modal';
    const modal = $(`<aside class="s-modal" id="${authModalId}" role="dialog" aria-labelledby="${authModalId}-modal-title" aria-describedby="${authModalId}-modal-description" aria-hidden="false" data-controller="s-modal" data-s-modal-target="modal"></aside>`);
    const modalBody = $(`<div class="s-modal--dialog" role="document">
    <h1 class="s-modal--header" id="${authModalId}-modal-title">Authorise Case Manager</h1>
    <p class="s-modal--body" id="${authModalId}-modal-description">The Case Manager requires API access validate your user account.</p>
    <ol>
        <li>
            <a class="s-link s-link__underlined" href="${seTokenAuthRoute}" target="_blank" rel="noopener noreferrer">Authorise App</a>
        </li>
        <li><label for="${authModalId}-input" class="mr6">Access Token:</label><input style="width:225px" id="${authModalId}-input"/></li>
    </ol>
    <div class="d-flex gs8 gsx s-modal--footer">
        <button class="flex--item s-btn s-btn__primary" type="button" id="${authModalId}-save">Save</button>
        <button class="flex--item s-btn" type="button" data-action="s-modal#hide">Cancel</button>
    </div>
    <button class="s-modal--close s-btn s-btn__muted" aria-label="Close" data-action="s-modal#hide">
        <svg aria-hidden="true" class="svg-icon iconClearSm" width="14" height="14" viewBox="0 0 14 14">
            <path d="M12 3.41 10.59 2 7 5.59 3.41 2 2 3.41 5.59 7 2 10.59 3.41 12 7 8.41 10.59 12 12 10.59 8.41 7 12 3.41Z"></path>
        </svg>
    </button>
</div>`);
    modalBody.find(`#${authModalId}-save`).on('click', (ev) => {
        ev.preventDefault();
        const inputValue = $(`#${authModalId}-input`).val();
        if (inputValue !== undefined && inputValue.length > 0) {
            GM_setValue(seApiTokenGmStorageKey, inputValue);
            void requestNewJwt().then(() => {
                window.location.reload();
            });
        }
    });
    modal.append(modalBody);
    $('body').append(modal);
};

;// CONCATENATED MODULE: ./src/Scripts/ProfileAnswerSummaryIndicator.ts


const getAnswerIdsOnPage = () => {
    return new Set($('.s-post-summary').map((i, e) => {
        return Number(e.getAttribute('data-post-id'));
    }).toArray());
};
const setDifference = (a, b) => {
    return new Set([...a].filter(i => !b.has(i)));
};
const setIntersection = (a, b) => {
    return new Set([...a].filter(i => b.has(i)));
};
const mergeSets = (a, b) => {
    return new Set([...a, ...b]);
};
class SummaryAnnotator {
    constructor() {
        this.checkedPostIds = new Set();
        this.annotatedPosts = new Set();
    }
    updateSets() {
        const postIdsOnPage = getAnswerIdsOnPage();
        const uncheckedIds = [...setDifference(postIdsOnPage, this.checkedPostIds)];
        if (uncheckedIds.length === 0) {
            this.render(postIdsOnPage);
            return;
        }
        void getSummaryPostInfoFromIds(uncheckedIds).then(postResults => {
            this.annotatedPosts = mergeSets(this.annotatedPosts, postResults);
            this.checkedPostIds = mergeSets(this.checkedPostIds, postIdsOnPage);
            this.render(postIdsOnPage);
        });
    }
    render(postsOnPage) {
        for (const postId of setIntersection(postsOnPage, this.annotatedPosts)) {
            $(`#answer-id-${postId} .s-post-summary--stats-item:eq(0)`)
                .before($(`<div title="This post is noted in the Case Manager System" class="s-post-summary--stats-item" style="color: var(--red-600)">${buildCaseSvg()}</div>`));
        }
    }
}
const buildAnswerSummaryIndicator = () => {
    const summaryAnnotator = new SummaryAnnotator();
    summaryAnnotator.updateSets();
    const matchPattern = new RegExp(`users/tab/\\d+\\${userAnswerTabProfile}`, 'gi');
    $(document).on('ajaxComplete', (_0, _1, { url }) => {
        if (url.match(matchPattern)) {
            summaryAnnotator.updateSets();
        }
    });
};

;// CONCATENATED MODULE: ./src/SEAPI.ts

const apiKey = 'BkvRpNB*IzKMdjAcikc4jA((';
const fetchFromSEAPI = (path, search) => {
    const usp = new URLSearchParams(search);
    usp.set('site', 'stackoverflow');
    usp.set('key', apiKey);
    usp.set('access_token', GM_getValue(seApiTokenGmStorageKey));
    return fetch(`https://api.stackexchange.com/2.3${path}?${usp.toString()}`);
};

;// CONCATENATED MODULE: ./src/Scripts/CaseManagerControlPanel.ts


const buildCaseManagerPane = (userId, isActive) => {
    const container = $('<div class="grid--item"></div>');
    const config = isActive ? {
        containerText: 'This user is <strong>currently under investigation</strong>.',
        buttonText: 'Close current investigation',
        apiRoute: 'close',
        buttonClasses: 's-btn__primary',
        modalOptions: {
            title: 'Close Current Investigation',
            body: 'Are you sure you want to close out the current investigation of this user? This will remove the user from the active cases list. Please only do this if the majority of posts have either been actioned on or if the user is not a serial plagiarist.',
            buttonLabel: 'Yes, I\'m sure'
        }
    } : {
        containerText: 'This user is <u>not</u> currently under investigation.',
        buttonText: 'Open an investigation',
        apiRoute: 'open',
        buttonClasses: 's-btn__danger s-btn__filled',
        modalOptions: {
            title: 'Open An Investigation',
            body: 'Are you sure you want to open an investigation into this user? This will add this user to a list of users under investigation. Please only do this if you suspect the user of serial plagiarism.',
            buttonLabel: 'Yes, I\'m sure'
        }
    };
    container.append($('<h3 class="fs-title mb8">Case Management Console</h3>'));
    container.append($(`<p>${config['containerText']}</p>`));
    const button = $(`<button class="ml16 s-btn ${config['buttonClasses']}">${config['buttonText']}</button>`);
    button.on('click', (ev) => {
        ev.preventDefault();
        void StackExchange.helpers.showConfirmModal(config['modalOptions']).then(shouldContinue => {
            if (shouldContinue) {
                void (isActive ?
                    fetchFromAWS(`/case/${config['apiRoute']}`, {
                        'method': 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ 'userId': userId })
                    })
                    :
                        fetchFromSEAPI(`/users/${userId}`, 'filter=!LnNkvqQOuAK0z-T)oydzPI')
                            .then(res => res.json())
                            .then((resData) => {
                            if (resData.items.length === 0) {
                                throw Error('User not found!');
                            }
                            const user = resData.items[0];
                            return fetchFromAWS(`/case/${config['apiRoute']}`, {
                                'method': 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    'userId': user['user_id'],
                                    'displayName': user['display_name'],
                                    'profileImage': user['profile_image']
                                })
                            });
                        })).then((res) => {
                    if (res.status === 200) {
                        return res.json().then((resData) => {
                            return container.replaceWith(buildCaseManagerPane(userId, resData['hasOpenCase']));
                        });
                    }
                    else if (res.status === 409) {
                        return res.json().then((resData) => {
                            StackExchange.helpers.showToast(resData['message'], {
                                transientTimeout: 10000,
                                type: 'warning'
                            });
                            return container.replaceWith(buildCaseManagerPane(userId, resData['hasOpenCase']));
                        });
                    }
                    throw Error('Something went wrong');
                });
            }
        });
    });
    container.append(button);
    return container;
};
const buildActionsSummaryPane = (postSummary) => {
    const container = $('<div class="grid--item p4 s-table-container"></div>');
    const actionTable = $('<table class="s-table"><thead><tr><th scope="col">Post Action</th><th scope="col">Number of Posts</th></tr></thead></table>');
    const actionTableBody = $('<tbody></tbody>');
    postSummary.forEach(post => {
        actionTableBody.append($(`<tr><td>${post['action_taken']}</td><td>${post['number_of_posts']}</td></tr>`));
    });
    actionTable.append(actionTableBody);
    container.append(actionTable);
    return container;
};
const buildCaseHistoryPane = (caseTimeline) => {
    const container = $('<div class="grid--item p8"><h3 class="fs-title mb8">Investigation History</h3></div>');
    const timeline = $('<div class="d-flex fd-column gs4"></div>');
    caseTimeline.forEach(entry => {
        timeline.append($(`<div class="flex--item d-flex fd-row jc-space-between ai-center" data-timeline-id="${entry['case_event_id']}"><a href="/users/${entry['account_id']}">${entry['display_name']}</a><span data-event-type-id="${entry['case_event_type_id']}">${entry['case_event_description']}</span><span>${new Date(entry['event_creation_date']).toLocaleString()}</span></div>`));
    });
    container.append(timeline);
    return container;
};
class CaseManagerControlPanel {
    constructor(userId) {
        this.userId = userId;
        this.container = $('<div class="d-flex mb48"></div>');
        this.currentPage = 'summary';
        this.pageLoadMap = { 'summary': { isLoaded: false }, 'posts': { isLoaded: false } };
    }
    setCurrentPage() {
        const usp = new URLSearchParams(window.location.search);
        if (!usp.has('page') || usp.get('page') === 'summary') {
            this.currentPage = 'summary';
        }
        else if (usp.get('page') === 'posts') {
            this.currentPage = 'posts';
        }
    }
    init() {
        this.setCurrentPage();
        window.addEventListener('popstate', () => {
            this.setCurrentPage();
            this.render();
        });
        this.render();
        return this.container;
    }
    buildNavLi(text, href, pageName) {
        const li = $('<li></li>');
        const active = this.currentPage === pageName;
        const a = $(`<a class="s-navigation--item pr48 ps-relative${active ? ' is-selected' : ''}" href="${href}">${text}</a>`);
        a.on('click', (ev) => {
            ev.preventDefault();
            this.currentPage = pageName;
            if (!active) {
                window.history.pushState({ 'cmcPageName': pageName }, '', href);
                this.render();
            }
        });
        li.append(a);
        return li;
    }
    buildNav() {
        const nav = $('<nav class="flex--item fl-shrink0 mr32" role="navigation"></nav>');
        const ul = $('<ul class="s-navigation s-navigation__muted s-navigation__vertical"></ul>');
        const pathName = window.location.pathname;
        const usp = new URLSearchParams(window.location.search);
        usp.set('page', 'summary');
        ul.append(this.buildNavLi('Summary', `${pathName}?${usp.toString()}`, 'summary'));
        usp.set('page', 'posts');
        ul.append(this.buildNavLi('Posts', `${pathName}?${usp.toString()}`, 'posts'));
        nav.append(ul);
        return nav;
    }
    async getSummaryPageData() {
        if (this.pageLoadMap['summary'].isLoaded && this.pageLoadMap['summary'].pageData) {
            return this.pageLoadMap['summary'].pageData;
        }
        else {
            const summaryPageData = await fetchFromAWS(`/case/summary/${this.userId}`).then(res => res.json());
            this.pageLoadMap['summary'] = {
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
        summaryPane.append(buildCaseManagerPane(this.userId, summaryPageData['hasOpenCase']));
        summaryPane.append(buildActionsSummaryPane(summaryPageData['postSummary']));
        if (summaryPageData['caseTimeline'].length > 0) {
            summaryPane.append(buildCaseHistoryPane(summaryPageData['caseTimeline']));
        }
        section.append(summaryPane);
        return section;
    }
    async getBreakdownData() {
        if (this.pageLoadMap['posts'].isLoaded && this.pageLoadMap['posts'].pageData) {
            return this.pageLoadMap['posts'].pageData;
        }
        else {
            const summaryPageData = await fetchFromAWS(`/case/posts/${this.userId}`).then(res => res.json());
            this.pageLoadMap['posts'] = {
                isLoaded: true,
                pageData: summaryPageData
            };
            return summaryPageData;
        }
    }
    async buildPostsBreakdownPage() {
        const section = $(`<section class="flex--item fl-grow1 wmx100"><div class="s-page-title mb24">
    <h1 class="s-page-title--header m0 baw0 p0">Posts</h1></section>`);
        const detailData = await this.getBreakdownData();
        const detailPane = $('<div class="d-grid grid__2 md:grid__1 g8"></div>');
        detailData.forEach((group) => {
            const groupContainer = $(`<div class="grid--item p8" data-event-id="${group['id']}"><h3 class="fs-title mb12">${group['timeline_event_description']}</h3></div>`);
            const linkContainer = $('<div class="d-flex fd-row fw-wrap gs16 hmn1 hmx4 overflow-y-scroll"></div>');
            group['post_ids'].forEach(post_id => {
                linkContainer.append($(`<a class="flex--item" href="/a/${post_id}" target="_blank" rel="noreferrer noopener">${post_id}</a>`));
            });
            groupContainer.append(linkContainer);
            detailPane.append(groupContainer);
        });
        section.append(detailPane);
        return section;
    }
    rebuildContainer(section) {
        this.container.empty();
        this.container.append(this.buildNav());
        this.container.append(section);
    }
    render() {
        if (this.currentPage === 'summary') {
            void this.buildCaseSummaryPage()
                .then((section) => {
                this.rebuildContainer(section);
            });
        }
        else if (this.currentPage === 'posts') {
            void this.buildPostsBreakdownPage()
                .then((section) => {
                this.rebuildContainer(section);
            });
        }
    }
}

;// CONCATENATED MODULE: ./src/Scripts/CasesList.ts


const buildUserTile = (account_id, profile_image, display_name, current_state, event_date) => {
    const link = `/users/${account_id}${userCaseManagerTabIdentifier}`;
    return $(`<div class="grid--item user-info">
                    ${profile_image !== null ? `<div class="user-gravatar48">
                        <a href="${link}"><div class="gravatar-wrapper-48"><img src="${profile_image}" alt="${display_name}'s user avatar" width="48" height="48" class="bar-sm"></div></a>
                    </div>` : ''}
                    <div class="user-details">
                        <a href="${link}">${display_name}</a>
                        <div class="d-flex fd-column mt6">
                            <span>Case ${current_state} on</span>
                            <span>${new Date(event_date).toLocaleString()}</span>
                        </div>
                    </div>
                </div>`);
};
class CasesUserList {
    constructor() {
        this.needsTotalPages = true;
        this.needsGroupInfo = true;
        this.currentPage = 1;
        this.totalPages = 1;
        this.group = '1';
        this.userData = [];
        this.search = '';
        this.groupInfo = [];
    }
    setCurrentPage() {
        const usp = new URLSearchParams(window.location.search);
        if (usp.has('page')) {
            this.currentPage = Number(usp.get('page'));
        }
        if (usp.has('group')) {
            this.group = usp.get('group');
        }
        if (usp.has('search')) {
            this.search = usp.get('search');
        }
    }
    buildPublicSearchQuery() {
        return `/users${casesTab}&group=${this.group}&page=${this.currentPage}${this.search.length > 0 ? `&search=${this.search}` : ''}`;
    }
    pullDownData() {
        return fetchFromAWS(`/cases?group=${this.group}&page=${this.currentPage}${this.search.length > 0 ? `&search=${this.search}` : ''}${this.needsTotalPages ? '&total-pages=true' : ''}${this.needsGroupInfo ? '&group-info=true' : ''}`)
            .then(res => res.json())
            .then((resData) => {
            this.totalPages = resData.totalPages || this.totalPages;
            this.groupInfo = resData.groupInfo || this.groupInfo;
            this.userData = resData.cases;
        });
    }
    pullDownAndRender() {
        return this.pullDownData().then(() => {
            this.render();
        });
    }
    init() {
        this.setCurrentPage();
        const main = $('#mainbar-full').empty();
        main.append($('<h1 class="fs-headline1 mb24">Plagiarists</h1>'));
        const searchToggleBar = $('<div class="d-flex fw-wrap ai-stretch md:d-block"></div>');
        const searchInput = $('<input id="userfilter" name="userfilter" class="s-input s-input__search h100 wmx3" autocomplete="off" type="text" placeholder="Filter by user">');
        if (this.search.length > 0) {
            searchInput.val(this.search);
        }
        searchInput.on('input', (ev) => {
            clearTimeout(this.searchTimeout);
            if (this.search !== ev.target.value) {
                this.search = ev.target.value;
                this.searchTimeout = setTimeout(() => {
                    this.currentPage = 1;
                    this.needsTotalPages = true;
                    window.history.pushState('search_paging', '', this.buildPublicSearchQuery());
                    void this.pullDownAndRender();
                }, 450);
            }
        });
        searchToggleBar.append($('<div class="flex--item mb12 ps-relative"></div>').append(searchInput).append($('<svg aria-hidden="true" class="s-input-icon s-input-icon__search svg-icon iconSearch" width="18" height="18" viewBox="0 0 18 18"><path d="m18 16.5-5.14-5.18h-.35a7 7 0 1 0-1.19 1.19v.35L16.5 18l1.5-1.5ZM12 7A5 5 0 1 1 2 7a5 5 0 0 1 10 0Z"></path></svg>')));
        searchToggleBar.append($(`<div class="flex--item ml-auto mb12 h100 d-flex s-btn-group js-filter-btn">
    <a class="js-sort-preference-change flex--item s-btn s-btn__muted s-btn__outlined" href="/users?tab=reputation"
       data-nav-xhref="" title="Users with the highest reputation scores" data-value="reputation" data-shortcut=""
       aria-current="page"> Reputation</a>
    <a class="js-sort-preference-change flex--item s-btn s-btn__muted s-btn__outlined" href="/users?tab=newusers"
       data-nav-xhref="" title="Users who joined in the last 30 days" data-value="newusers" data-shortcut=""> New
        users</a>
    <a class="js-sort-preference-change flex--item s-btn s-btn__muted s-btn__outlined" href="/users?tab=voters"
       data-nav-xhref="" title="Users who voted more than 10 times" data-value="voters" data-shortcut=""> Voters</a>
    <a class="js-sort-preference-change flex--item s-btn s-btn__muted s-btn__outlined" href="/users?tab=editors"
       data-nav-xhref="" title="Users who edited at least 5 posts" data-value="editors" data-shortcut=""> Editors</a>
    <a class="js-sort-preference-change flex--item s-btn s-btn__muted s-btn__outlined" href="/users?tab=moderators"
       data-nav-xhref="" title="Our current community moderators" data-value="moderators" data-shortcut="">
        Moderators</a>
    <a class="js-sort-preference-change youarehere is-selected flex--item s-btn s-btn__muted s-btn__outlined" href="/users${casesTab}"
       data-nav-xhref="" title="Users who have been or are currently under investigation" data-value="plagiarist"
       data-shortcut="">Plagiarists</a>
</div>`));
        main.append(searchToggleBar);
        main.append($('<div class="fs-body2 mt8 mb12"><div class="d-flex jc-space-between"><div class="flex--item ml-auto md:ml0"><div id="tabs-interval" class="subtabs d-flex"></div></div></div></div>'));
        main.append($('<div id="user-browser" class="d-grid grid__4 lg:grid__3 md:grid__2 sm:grid__1 g12"></div>'));
        main.append($('<div id="user-pagination" class="s-pagination site1 themed pager float-right"></div>'));
        void this.pullDownData().then(() => {
            this.needsTotalPages = false;
            this.needsGroupInfo = false;
            this.render();
        });
        window.addEventListener('popstate', () => {
            this.setCurrentPage();
            void this.pullDownAndRender();
        });
    }
    buildGroupToggleLink(group_id, description) {
        const href = `/users${casesTab}&group=${group_id}${this.search.length > 0 ? `&search=${this.search}` : ''}`;
        const a = $(`<a${group_id === this.group ? ' class="youarehere is-selected"' : ''} href="${href}" data-nav-xhref="" data-value="${group_id}" data-shortcut="">${description}</a>`);
        a.on('click', (ev) => {
            ev.preventDefault();
            if (this.group !== group_id) {
                window.history.pushState('group_paging', '', href);
                this.group = group_id;
                this.currentPage = 1;
                this.needsTotalPages = true;
                void this.pullDownAndRender();
            }
        });
        return a;
    }
    buildGroupToggle() {
        const mountPoint = $('#tabs-interval').empty();
        this.groupInfo.forEach((entry) => {
            mountPoint.append(this.buildGroupToggleLink(entry.group_id, entry.description));
        });
    }
    buildUserPanel() {
        const mountPoint = $('#user-browser').empty();
        this.userData.forEach((userData) => {
            mountPoint.append(buildUserTile(userData.investigated_user_id, userData.profile_image, userData.display_name, userData.current_state, userData.event_creation_date));
        });
    }
    buildHrefForNavItem(p) {
        return `/users${casesTab}&group=${this.group}&page=${p}${this.search.length > 0 ? `&search=${this.search}` : ''}`;
    }
    buildNavItem(pageNumber, linkLabel) {
        if (linkLabel === undefined) {
            linkLabel = pageNumber;
        }
        const href = this.buildHrefForNavItem(pageNumber);
        const a = $(`<a class="s-pagination--item" href="${href}">${linkLabel}</a>`);
        a.on('click', (ev) => {
            ev.preventDefault();
            window.history.pushState('paging', '', href);
            this.currentPage = pageNumber;
            void this.pullDownAndRender();
        });
        return a;
    }
    buildPagination() {
        const mountPoint = $('#user-pagination').empty();
        if (this.totalPages === 1) {
            return;
        }
        const buildPagesFromRange = (p) => {
            const pageNumber = p + 1;
            if (pageNumber === this.currentPage) {
                mountPoint.append(`<span class="s-pagination--item is-selected" aria-current="page">${pageNumber}</span>`);
            }
            else {
                mountPoint.append(this.buildNavItem(pageNumber));
            }
        };
        if (this.currentPage !== 1) {
            mountPoint.append(this.buildNavItem(this.currentPage - 1, 'Prev'));
        }
        const maxVisibleElements = 5;
        if (this.totalPages <= maxVisibleElements + 2) {
            [...Array(this.totalPages).keys()].forEach(buildPagesFromRange);
        }
        else {
            if (this.currentPage - maxVisibleElements >= 0) {
                mountPoint.append(this.buildNavItem(1));
                mountPoint.append('<span class="s-pagination--item s-pagination--item__clear">…</span>');
            }
            if (this.currentPage < maxVisibleElements) {
                [...Array(maxVisibleElements).keys()].forEach(buildPagesFromRange);
            }
            else if (this.currentPage > this.totalPages - maxVisibleElements) {
                [...Array(maxVisibleElements).keys()].forEach(p => {
                    buildPagesFromRange(this.totalPages - maxVisibleElements + p);
                });
            }
            else {
                [...Array(maxVisibleElements).keys()].forEach(p => {
                    buildPagesFromRange(this.currentPage - Math.ceil(maxVisibleElements / 2) + p);
                });
            }
            if (this.totalPages - this.currentPage >= maxVisibleElements) {
                mountPoint.append('<span class="s-pagination--item s-pagination--item__clear">…</span>');
                mountPoint.append(this.buildNavItem(this.totalPages));
            }
        }
        if (this.currentPage !== this.totalPages) {
            mountPoint.append(this.buildNavItem(this.currentPage + 1, 'Next'));
        }
    }
    render() {
        this.buildGroupToggle();
        this.buildUserPanel();
        this.buildPagination();
    }
}

;// CONCATENATED MODULE: ./src/Scripts/UserScriptSettings.ts


const buildUserScriptSettingsPanel = async () => {
    const tokens = await fetchFromAWS('/auth/credentials').then(res => res.json());
    const container = $('<div></div>');
    container.append('<div class="s-page-title mb24"><h1 class="s-page-title--header m0 baw0 p0">Case Manager UserScript Settings</h1></div>');
    const toolGrid = $('<div class="d-grid grid__2 md:grid__1 g8"></div>');
    container.append(toolGrid);
    const existingTokensComponent = $('<div></div>');
    toolGrid.append(existingTokensComponent);
    existingTokensComponent.append('<h3 class="fs-title mb12">Existing Auth Tokens</h3>');
    const tokenList = $('<div></div>');
    existingTokensComponent.append(tokenList);
    tokens.forEach((token) => {
        const tokenRow = $('<div class="d-flex fd-row ai-center"></div>');
        tokenList.append(tokenRow);
        tokenRow.append(`<span>${token}</span>`);
        const invalidateButton = $('<button class="s-btn s-btn__danger">Invalidate</button>');
        invalidateButton.on('click', (ev) => {
            ev.preventDefault();
            void fetchFromAWS(`/auth/credentials/${token}/invalidate`).then((res) => {
                if (res.status === 200) {
                    tokenRow.remove();
                    if (GM_getValue(seApiTokenGmStorageKey) === token) {
                        GM_deleteValue(seApiTokenGmStorageKey);
                        GM_deleteValue(accessTokenGmStorageKey);
                        window.location.reload();
                    }
                }
            });
        });
        tokenRow.append(invalidateButton);
    });
    const deAuthoriseButton = $('<button class="s-btn s-btn__outlined s-btn__danger mt16" id="app-24380">De-authenticate Application</button>');
    existingTokensComponent.append(deAuthoriseButton);
    deAuthoriseButton.on('click', (ev) => {
        ev.preventDefault();
        void StackExchange.helpers.showConfirmModal({
            title: 'De-authenticate this Application',
            bodyHtml: '<p>Are you sure you want to de-authenticate this application? All existing access tokens will be invalidated and removed from storage. This app will no longer appear in your authorized applications list. You will no longer be able to use any existing access tokens and will need to reauthenticate to continue use.</p><p><b>Note:</b> All of your actions will be retained and associated to your user id even after de-authenticating. You may resume access at any time by authorising the application again.</p>',
            buttonLabel: 'De-authenticate',
        }).then((confirm) => {
            if (confirm) {
                void fetchFromAWS(`/auth/credentials/${GM_getValue(seApiTokenGmStorageKey)}/de-authenticate`)
                    .then((res) => {
                    if (res.status === 200) {
                        GM_deleteValue(seApiTokenGmStorageKey);
                        GM_deleteValue(accessTokenGmStorageKey);
                        window.location.reload();
                    }
                });
            }
        });
    });
    const getNewToken = $('<div></div>');
    toolGrid.append(getNewToken);
    getNewToken.append('<h3 class="fs-title mb12">Issue new token</h3>');
    getNewToken.append('<p>You can issue a new auth token for use on another device or to manually replace an existing token. Please invalidate any existing tokens, so they can no longer be used to access your information.</p>');
    getNewToken.append(`<a class="s-link s-link__underlined" href="${seTokenAuthRoute}" target="_blank" rel="noopener noreferrer">Issue new auth token</a>`);
    return container;
};

;// CONCATENATED MODULE: ./src/Main.ts








const UserScript = () => {
    if (GM_getValue(accessTokenGmStorageKey, null) === null) {
        startAuthFlow();
        return;
    }
    const currentUserProfilePattern = new RegExp(`^/users/${StackExchange.options.user.userId}.*`);
    if (window.location.pathname.match(/^\/questions\/.*/) !== null) {
        void buildAnswerControlPanel();
    }
    else if (window.location.pathname.match(/^\/users$/) !== null) {
        const primaryUsersNav = $('.js-filter-btn');
        const a = $(`<a class="js-sort-preference-change flex--item s-btn s-btn__muted s-btn__outlined" href="/users${casesTab}" data-nav-xhref="" title="Users who have been or are currently under investigation" data-value="plagiarist" data-shortcut="">Plagiarists</a>`);
        primaryUsersNav.append(a);
        if (window.location.search.startsWith(casesTab)) {
            const cmUserCaseSummaryPage = new CasesUserList();
            cmUserCaseSummaryPage.init();
        }
    }
    else if (window.location.pathname.match(currentUserProfilePattern) !== null) {
        const navButton = $(`<a href="${window.location.pathname}${userCaseManagerSettingsTabIdentifier}" class="s-navigation--item">Case Manager Settings</a>`);
        const tabContainer = $('.user-show-new .s-navigation:eq(0)');
        tabContainer.append(navButton);
        if (window.location.search.startsWith(userCaseManagerSettingsTabIdentifier)) {
            const mainPanel = $('#mainbar-full');
            mainPanel.empty();
            void buildUserScriptSettingsPanel().then(c => {
                mainPanel.append(c);
            });
        }
    }
    else if (window.location.pathname.match(/^\/users\/.*/) !== null) {
        const userPath = window.location.pathname.match(/^\/users\/\d+/g);
        if (userPath === null || userPath.length !== 1) {
            throw Error('Something changed in user path!');
        }
        const userId = Number(userPath[0].split('/')[2]);
        const navButton = $(`<a href="${window.location.pathname}${userCaseManagerTabIdentifier}" class="s-navigation--item">Case Manager</a>`);
        void fetchFromAWS(`/case/user/${userId}`)
            .then(res => res.json())
            .then((resData) => {
            if (resData['is_known_user']) {
                navButton.prepend(buildAlertSvg(16, 20));
            }
        });
        const tabContainer = $('.user-show-new .s-navigation:eq(0)');
        tabContainer.append(navButton);
        if (window.location.search.startsWith(userCaseManagerTabIdentifier)) {
            const selectedClass = 'is-selected';
            tabContainer.find('a').removeClass(selectedClass);
            navButton.addClass(selectedClass);
            const mainPanel = $('#mainbar-full > div:last-child');
            const cmUserControlPanel = new CaseManagerControlPanel(userId);
            mainPanel.replaceWith(cmUserControlPanel.init());
        }
        else if (window.location.search.startsWith(userAnswerTabProfile)) {
            buildAnswerSummaryIndicator();
        }
    }
};
StackExchange.ready(() => {
    UserScript();
});

/******/ })()
;