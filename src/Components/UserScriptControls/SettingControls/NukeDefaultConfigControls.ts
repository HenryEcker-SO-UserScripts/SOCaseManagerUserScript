import {type ActionEvent} from '@hotwired/stimulus';
import {type CmNukePostConfig, nukePostDefaultConfigString, nukePostOptions} from '../../../API/gmAPI';
import {getMessageFromCaughtElement} from '../../../Utils/ErrorHandlingHelpers';

export function buildNukeConfigControls(): JQuery {
    registerNukeConfigSettingsController();
    return $('<div></div>')
        .append('<h3 class="fs-title mb12">Edit base options for nuking posts</h3>')
        .append(buildTemplateForm());
}


function buildTemplateForm() {
    return NUKE_POST_SAVE_CONFIG_FORM;
}

function registerNukeConfigSettingsController() {
    Stacks.addController(NUKE_POST_SAVE_CONFIG_CONTROLLER, {
        targets: NUKE_POST_SAVE_CONFIG_DATA_TARGETS,
        get shouldFlag(): boolean {
            return this[NUKE_POST_SAVE_CONFIG_SHOULD_FLAG_TARGET].checked as boolean;
        },
        get shouldComment(): boolean {
            return this[NUKE_POST_SAVE_CONFIG_SHOULD_COMMENT_TARGET].checked as boolean;
        },
        get shouldLog(): boolean {
            return this[NUKE_POST_SAVE_CONFIG_SHOULD_LOG_TARGET].checked;
        },
        get commentTemplate(): string {
            return this[NUKE_POST_SAVE_CONFIG_COMMENT_TARGET].value ?? '';
        },
        get flagTemplate(): string {
            return this[NUKE_POST_SAVE_CONFIG_SHOULD_COMMENT_TARGET].value ?? '';
        },
        connect() {
            const nukePostConfig: CmNukePostConfig = JSON.parse(GM_getValue(nukePostOptions, nukePostDefaultConfigString));

            if (nukePostConfig.flag) {
                this[NUKE_POST_SAVE_CONFIG_SHOULD_FLAG_TARGET].checked = true;
            }
            if (nukePostConfig.comment) {
                this[NUKE_POST_SAVE_CONFIG_SHOULD_COMMENT_TARGET].checked = true;
            }
            if (nukePostConfig.log) {
                this[NUKE_POST_SAVE_CONFIG_SHOULD_LOG_TARGET].checked = true;
            }

            this[NUKE_POST_SAVE_CONFIG_FLAG_DETAIL_TARGET].value = nukePostConfig.flagDetailText ?? '';
            this[NUKE_POST_SAVE_CONFIG_COMMENT_TARGET].value = nukePostConfig.commentText ?? '';
        },
        NUKE_POST_SAVE_CONFIG_HANDLE_SAVE(ev: ActionEvent) {
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
    });
}
