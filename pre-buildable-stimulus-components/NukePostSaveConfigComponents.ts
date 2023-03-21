import {validationBounds} from '../src/Utils/ValidationHelpers';
import {buildCheckbox, buildTextarea} from './StimulusComponentBuilder';
import {cleanWhitespace} from './StimulusPackageUtils';

const ids = {
    shouldFlagCheckbox: 'socm-nuke-config-should-flag',
    shouldCommentCheckbox: 'socm-nuke-config-should-comment',
    shouldLogCheckbox: 'socm-nuke-config-should-log',
    flagDetailTemplateTextarea: 'socm-nuke-config-flag-template',
    commentTemplateTextarea: 'socm-nuke-config-comment-template'
};

const data = {
    controller: 'socm-nuke-config-settings',
    target: {
        shouldFlagCheckbox: 'nuke-config-should-flag',
        shouldCommentCheckbox: 'nuke-config-should-comment',
        shouldLogCheckbox: 'nuke-config-should-log',
        flagDetailTemplateTextarea: 'nuke-config-flag-template',
        commentTemplateTextarea: 'nuke-config-comment-template'
    },
    action: {
        handleSaveConfig: 'handleSaveConfig',
        handleResetConfig: 'handleResetConfig',
    }
};


const nukeConfigSaveForm = `<form class="d-flex fd-column g12" data-controller="${data.controller}" data-action="submit->${data.controller}#${data.action.handleSaveConfig} reset->${data.controller}#${data.action.handleResetConfig}">${
    buildCheckbox('Should Flag', ids.shouldFlagCheckbox, data.controller, data.target.shouldFlagCheckbox)
}${
    buildCheckbox('Should Comment', ids.shouldCommentCheckbox, data.controller, data.target.shouldCommentCheckbox)
}${
    buildCheckbox('Should Log', ids.shouldLogCheckbox, data.controller, data.target.shouldLogCheckbox)
}${
    buildTextarea(
        ids.flagDetailTemplateTextarea, 'flag detail template', 5,
        data.controller, data.target.flagDetailTemplateTextarea,
        'Flag Detail Text Template:',
        validationBounds.flagDetailTextarea
    )
}${
    buildTextarea(
        ids.commentTemplateTextarea,
        'comment template',
        5,
        data.controller, data.target.commentTemplateTextarea,
        'Comment Text Template:',
        validationBounds.commentTextarea
    )
}<div class="d-flex fd-row g8"><button class="s-btn s-btn__primary" type="submit">Save Config</button><button class="s-btn s-btn__muted" type="reset">Reset To Default</button></div></form>`;

export default {
    CONTROLLER: data.controller,
    FORM: cleanWhitespace(nukeConfigSaveForm),
    DATA_TARGETS: [...Object.values(data.target)],
    SHOULD_FLAG_TARGET: `${data.target.shouldFlagCheckbox}Target`,
    SHOULD_COMMENT_TARGET: `${data.target.shouldCommentCheckbox}Target`,
    SHOULD_LOG_TARGET: `${data.target.shouldLogCheckbox}Target`,
    FLAG_DETAIL_TARGET: `${data.target.flagDetailTemplateTextarea}Target`,
    COMMENT_TARGET: `${data.target.commentTemplateTextarea}Target`,
    HANDLE_SAVE: data.action.handleSaveConfig,
    HANDLE_RESET: data.action.handleResetConfig
};