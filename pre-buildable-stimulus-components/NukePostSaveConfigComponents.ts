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
        handleSaveConfig: 'handleSaveConfig'
    }
};


const nukeConfigSaveForm = `<form class="d-flex fd-column g12" data-controller="${data.controller}" data-action="submit->${data.controller}#${data.action.handleSaveConfig}">${
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
}<div><button class="s-btn s-btn__primary" type="submit">Save Config</button></div></form>`;

export default {
    NUKE_POST_SAVE_CONFIG_CONTROLLER: JSON.stringify(data.controller),
    NUKE_POST_SAVE_CONFIG_FORM: JSON.stringify(cleanWhitespace(nukeConfigSaveForm)),
    NUKE_POST_SAVE_CONFIG_DATA_TARGETS: JSON.stringify([...Object.values(data.target)]),
    NUKE_POST_SAVE_CONFIG_SHOULD_FLAG_TARGET: `'${data.target.shouldFlagCheckbox}Target'`,
    NUKE_POST_SAVE_CONFIG_SHOULD_COMMENT_TARGET: `'${data.target.shouldCommentCheckbox}Target'`,
    NUKE_POST_SAVE_CONFIG_SHOULD_LOG_TARGET: `'${data.target.shouldLogCheckbox}Target'`,
    NUKE_POST_SAVE_CONFIG_FLAG_DETAIL_TARGET: `'${data.target.flagDetailTemplateTextarea}Target'`,
    NUKE_POST_SAVE_CONFIG_COMMENT_TARGET: `'${data.target.commentTemplateTextarea}Target'`,
    NUKE_POST_SAVE_CONFIG_HANDLE_SAVE: data.action.handleSaveConfig,
};