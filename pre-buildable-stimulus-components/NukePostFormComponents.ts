import {buildTextarea, buildTextInput, buildToggle} from './StimulusComponentBuilder';
import {validationBounds} from '../src/Utils/ValidationHelpers';
import {cleanWhitespace} from './StimulusPackageUtils';

const ids = {
    modal: 'socm-nuke-post-form-{postId}',
    enableFlagToggle: 'socm-flag-enable-toggle-{postId}',
    enableCommentToggle: 'socm-comment-enable-toggle-{postId}',
    enableLogToggle: 'socm-log-nuked-post-toggle-{postId}',
    flagOriginalSourceTextarea: 'socm-nuke-flag-original-source-area-{postId}',
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
        flagOriginalSourceTextarea: 'flag-original-source-area',
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
        <div class="s-modal--body" style="margin-bottom: 0;">
            <div class="d-flex fd-column g8">
            ${
    buildFieldControlToggle(
        'Flag before deletion',
        ids.enableFlagToggle,
        data.target.enableFlagToggle,
        data.target.flagControlFields
    )}${
    buildFieldControlArea(
        data.target.flagControlFields,
        buildTextInput(
            'Link(s) to original content',
            ids.flagOriginalSourceTextarea,
            'flag source link',
            data.controller,
            data.target.flagOriginalSourceTextarea
        ) + '\n' +
        buildTextarea(
            ids.flagDetailTextarea,
            'flag detail text',
            5,
            data.controller,
            data.target.flagDetailTextarea,
            'Why do you consider this answer to be plagiarized?',
            validationBounds.flagDetailTextarea))}${modalDivider}${
    buildFieldControlToggle(
        'Comment after deletion',
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
            'Comment Text',
            validationBounds.commentTextarea)
    )}${modalDivider}${
    buildToggle(
        'Log post in Case Manager',
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
    FORM: cleanWhitespace(nukePostForm),
    FORM_MODAL_ID: ids.modal,
    FORM_CONTROLLER: data.controller,
    DATA_TARGETS: [...Object.values(data.target)],
    ENABLE_FLAG_TOGGLE_TARGET: `${data.target.enableFlagToggle}Target`,
    ENABLE_COMMENT_TOGGLE_TARGET: `${data.target.enableCommentToggle}Target`,
    ENABLE_LOG_TOGGLE_TARGET: `${data.target.enableLogToggle}Target`,
    COMMENT_TEXT_TARGET: `${data.target.commentTextarea}Target`,
    FLAG_ORIGINAL_SOURCE_TEXT_TARGET: `${data.target.flagOriginalSourceTextarea}Target`,
    FLAG_DETAIL_TEXT_TARGET: `${data.target.flagDetailTextarea}Target`,
    FLAG_CONTROL_FIELDS_TARGET: `${data.target.flagControlFields}Target`,
    COMMENT_CONTROL_FIELDS_TARGET: `${data.target.commentControlFields}Target`,
    HANDLE_SUBMIT: data.action.handleSubmitActions,
    HANDLE_CANCEL: data.action.handleCancelActions,
    HANDLE_UPDATE_CONTROLLED_FIELD: data.action.handleUpdateControlledField,
};