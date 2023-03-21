import {type CmNukePostConfig, nukePostDefaultConfigString, nukePostOptions} from '../../../API/gmAPI';
import {buildCheckbox, buildTextarea, validationBounds} from '../../../Utils/StimulusComponentBuilder';
import {type ActionEvent} from '@hotwired/stimulus';
import {getMessageFromCaughtElement} from '../../../Utils/ErrorHandlingHelpers';

export function buildNukeConfigControls(): JQuery {
    registerNukeConfigSettingsController();
    return $('<div></div>')
        .append('<h3 class="fs-title mb12">Edit base options for nuking posts</h3>')
        .append(buildTemplateForm());
}

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

function buildTemplateForm() {
    const nukePostConfig: CmNukePostConfig = JSON.parse(GM_getValue(nukePostOptions, nukePostDefaultConfigString));
    return `<form class="d-flex fd-column g12" data-controller="${data.controller}" data-action="submit->${data.controller}#${data.action.handleSaveConfig}">${
        buildCheckbox('Should Flag', ids.shouldFlagCheckbox, data.controller, data.target.shouldFlagCheckbox, nukePostConfig.flag)
    }${
        buildCheckbox('Should Comment', ids.shouldCommentCheckbox, data.controller, data.target.shouldCommentCheckbox, nukePostConfig.comment)
    }${
        buildCheckbox('Should Log', ids.shouldLogCheckbox, data.controller, data.target.shouldLogCheckbox, nukePostConfig.log)
    }${
        buildTextarea(
            ids.flagDetailTemplateTextarea, 'flag detail template', nukePostConfig.flagDetailText, 5,
            data.controller, data.target.flagDetailTemplateTextarea,
            'Flag Detail Text Template',
            validationBounds.flagDetailTextarea
        )
    }${
        buildTextarea(
            ids.commentTemplateTextarea,
            'comment template',
            nukePostConfig.commentText,
            5,
            data.controller, data.target.commentTemplateTextarea,
            'Comment Text Template',
            validationBounds.commentTextarea
        )
    }<div><button class="s-btn s-btn__primary" type="submit">Save Config</button></div></form>`;
}

function registerNukeConfigSettingsController() {
// TODO Create Stacks Controller
    const controllerConfig = {
        targets: [...Object.values(data.target)],
        get shouldFlag(): boolean {
            return (this[`${data.target.shouldFlagCheckbox}Target`] as unknown as HTMLInputElement).checked as boolean;
        },
        get shouldComment(): boolean {
            return (this[`${data.target.shouldCommentCheckbox}Target`] as unknown as HTMLInputElement).checked as boolean;
        },
        get shouldLog(): boolean {
            return (this[`${data.target.shouldLogCheckbox}Target`] as unknown as HTMLInputElement).checked;
        },
        get commentTemplate(): string {
            return (this[`${data.target.commentTemplateTextarea}Target`] as unknown as HTMLTextAreaElement).value ?? '';
        },
        get flagTemplate(): string {
            return (this[`${data.target.flagDetailTemplateTextarea}Target`] as unknown as HTMLTextAreaElement).value ?? '';
        },
        [data.action.handleSaveConfig](ev: ActionEvent) {
            ev.preventDefault();
            try {
                const newConfig: CmNukePostConfig = {
                    flagDetailText: this.flagTemplate,
                    commentText: this.commentTemplate,
                    flag: this.shouldFlag,
                    comment: this.shouldComment,
                    log: this.shouldLog
                };
                GM_setValue(nukePostOptions, JSON.stringify(newConfig));

                StackExchange.helpers.showToast('Config updated successfully!', {
                    type: 'success',
                    transientTimeout: 3000
                });
            } catch (e: unknown) {
                StackExchange.helpers.showToast(getMessageFromCaughtElement(e), {
                    type: 'danger',
                    transientTimeout: 5000
                });
            }
        },
    };
    Stacks.addController(data.controller, controllerConfig);
}
