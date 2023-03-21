import {buildTextarea, buildToggle} from './StimulusComponentBuilder';
import {validationBounds} from '../src/Utils/ValidationHelpers';
import {cleanWhitespace} from './StimulusPackageUtils';

const ids = {
    modal: 'socm-nuke-post-form-{postId}',
    enableFlagToggle: 'socm-flag-enable-toggle-{postId}',
    enableCommentToggle: 'socm-comment-enable-toggle-{postId}',
    enableLogToggle: 'socm-log-nuked-post-toggle-{postId}',
    flagLinkTextarea: 'socm-nuke-flag-link-area-{postId}',
    flagDetailTextarea: 'socm-nuke-flag-detail-area-{postId}',
    commentTextarea: 'socm-nuke-comment-area-{postId}'
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


function buildFieldControlToggle(labelText: string, inputId: string, inputTarget: string, controlParam: string) {
    return buildToggle(labelText, inputId, data.controller, inputTarget,
        `data-${data.controller}-${data.params.controls}-param="${controlParam}"
           data-action="change->${data.controller}#${data.action.handleUpdateControlledField}"`
    );
}

function buildFieldControlArea(target: string, innerHTML: string) {
    return `
<div class="d-flex fd-column g8" data-${data.controller}-target="${target}">${innerHTML}</div>`;
}

const modalDivider = '<div class="my6 bb bc-black-400"></div>';

const nukePostForm = `
<aside class="s-modal s-modal__danger" id="{modalId}" tabindex="-1" role="dialog" aria-hidden="false" data-controller="s-modal" data-s-modal-target="modal">
    <div class="s-modal--dialog" style="min-width:550px; width: max-content; max-width: 65vw;" 
         role="document" 
         data-controller="${data.controller}">
        <h1 class="s-modal--header">Nuke Plagiarism</h1>
        <div class="s-modal--body">
            <div class="d-flex fd-column g8">
            ${
    buildFieldControlToggle(
        'Flag before deletion:',
        ids.enableFlagToggle,
        data.target.enableFlagToggle,
        data.target.flagControlFields
    )}${
    buildFieldControlArea(
        data.target.flagControlFields,
        buildTextarea(
            ids.flagLinkTextarea,
            'flag link text',
            2,
            data.controller,
            data.target.flagLinkTextarea,
            'Link to source:',
            validationBounds.flagLinkTextarea)
        + '\n' +
        buildTextarea(
            ids.flagDetailTextarea,
            'flag detail text',
            5,
            data.controller,
            data.target.flagDetailTextarea,
            'Flag Detail Text:',
            validationBounds.flagDetailTextarea))}${modalDivider}${
    buildFieldControlToggle(
        'Comment after deletion:',
        ids.enableCommentToggle,
        data.target.enableCommentToggle,
        data.target.commentControlFields
    )}${
    buildFieldControlArea(
        data.target.commentControlFields,
        buildTextarea(
            ids.commentTextarea,
            'comment text',
            5,
            data.controller,
            data.target.commentTextarea,
            'Comment Text:',
            validationBounds.commentTextarea)
    )}${modalDivider}${
    buildToggle(
        'Log post in Case Manager:',
        ids.enableLogToggle,
        data.controller,
        data.target.enableLogToggle
    )}
    </div>
    <div class="d-flex gx8 s-modal--footer ai-center">
        <button class="s-btn flex--item s-btn__filled s-btn__danger" 
                type="button" 
                data-${data.controller}-target="${data.target.nukePostButton}" 
                data-action="click->${data.controller}#${data.action.handleSubmitActions}" 
                data-${data.controller}-${data.params.postId}-param="{postId}" 
                data-${data.controller}-${data.params.postOwner}-param="{postOwnerId}">Nuke Post</button>
        <button class="s-btn flex--item s-btn__muted" 
                type="button" 
                data-action="click->${data.controller}#${data.action.handleCancelActions}"
                data-${data.controller}-${data.params.postId}-param="{postId}" >Cancel</button>
        <a class="fs-fine ml-auto" href="/users/current?tab=case-manager-settings" target="_blank">Configure default options</a>
    </div>        
    <button class="s-modal--close s-btn s-btn__muted" type="button" aria-label="Close" data-action="s-modal#hide"><svg aria-hidden="true" class="svg-icon iconClearSm" width="14" height="14" viewBox="0 0 14 14"><path d="M12 3.41 10.59 2 7 5.59 3.41 2 2 3.41 5.59 7 2 10.59 3.41 12 7 8.41 10.59 12 12 10.59 8.41 7 12 3.41Z"></path></svg></button>
    </div>
</aside>`;


export default {
    NUKE_POST_FORM: `'${cleanWhitespace(nukePostForm)}'`,
    NUKE_POST_FORM_MODAL_ID: JSON.stringify(ids.modal),
    NUKE_POST_FORM_CONTROLLER: JSON.stringify(data.controller),
    NUKE_POST_DATA_TARGETS: JSON.stringify([...Object.values(data.target)]),
    NUKE_POST_ENABLE_FLAG_TOGGLE_TARGET: `'${data.target.enableFlagToggle}Target'`,
    NUKE_POST_ENABLE_COMMENT_TOGGLE_TARGET: `'${data.target.enableCommentToggle}Target'`,
    NUKE_POST_ENABLE_LOG_TOGGLE_TARGET: `'${data.target.enableLogToggle}Target'`,
    NUKE_POST_COMMENT_TEXT_TARGET: `'${data.target.commentTextarea}Target'`,
    NUKE_POST_FLAG_LINK_TEXT_TARGET: `'${data.target.flagLinkTextarea}Target'`,
    NUKE_POST_FLAG_DETAIL_TEXT_TARGET: `'${data.target.flagDetailTextarea}Target'`,
    NUKE_POST_FLAG_CONTROL_FIELDS_TARGET: `'${data.target.flagControlFields}Target'`,
    NUKE_POST_COMMENT_CONTROL_FIELDS_TARGET: `'${data.target.commentControlFields}Target'`,
    NUKE_POST_HANDLE_SUBMIT: data.action.handleSubmitActions,
    NUKE_POST_HANDLE_CANCEL: data.action.handleCancelActions,
    NUKE_POST_HANDLE_UPDATE_CONTROLLED_FIELD: data.action.handleUpdateControlledField,
};