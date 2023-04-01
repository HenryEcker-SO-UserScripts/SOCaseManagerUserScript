import {type ActionEvent} from '@hotwired/stimulus';
import {
    commentTextLengthBounds,
    plagiarismFlagLengthBounds
} from 'se-ts-userscript-utilities/Validators/TextLengthValidators';
import {type CmNukePostConfig, nukePostDefaultConfigString, nukePostOptions} from '../../../API/gmAPI';
import {getMessageFromCaughtElement} from '../../../Utils/ErrorHandlingHelpers';

export function buildNukeConfigControls(): JQuery {
    registerNukeConfigSettingsController();
    return $('<div></div>')
        .append('<h3 class="fs-title mb12">Edit base options for nuking posts</h3>')
        .append(SAVE_NUKE_CONFIG.FORM);
}

function registerNukeConfigSettingsController() {
    Stacks.addController(SAVE_NUKE_CONFIG.CONTROLLER, {
        targets: SAVE_NUKE_CONFIG.DATA_TARGETS,
        get shouldFlag(): boolean {
            return this[SAVE_NUKE_CONFIG.SHOULD_FLAG_TARGET].checked as boolean;
        },
        get shouldComment(): boolean {
            return this[SAVE_NUKE_CONFIG.SHOULD_COMMENT_TARGET].checked as boolean;
        },
        get shouldLog(): boolean {
            return this[SAVE_NUKE_CONFIG.SHOULD_LOG_TARGET].checked;
        },
        get commentTemplate(): string {
            return this[SAVE_NUKE_CONFIG.COMMENT_TARGET].value ?? '';
        },
        get flagTemplate(): string {
            return this[SAVE_NUKE_CONFIG.FLAG_DETAIL_TARGET].value ?? '';
        },
        setValues(config: CmNukePostConfig) {
            this[SAVE_NUKE_CONFIG.SHOULD_FLAG_TARGET].checked = config.flag;
            this[SAVE_NUKE_CONFIG.SHOULD_COMMENT_TARGET].checked = config.comment;
            this[SAVE_NUKE_CONFIG.SHOULD_LOG_TARGET].checked = config.log;

            const flagTa = $(this[SAVE_NUKE_CONFIG.FLAG_DETAIL_TARGET]);
            flagTa
                .val(config.flagDetailText ?? '')
                .charCounter({
                    ...plagiarismFlagLengthBounds.explanation,
                    target: flagTa.parent().find('span.text-counter')
                });

            const commentTa = $(this[SAVE_NUKE_CONFIG.COMMENT_TARGET]);
            commentTa
                .val(config.commentText ?? '')
                .charCounter({
                    ...commentTextLengthBounds,
                    target: commentTa.parent().find('span.text-counter')
                });
        },
        connect() {
            const nukePostConfig: CmNukePostConfig = JSON.parse(GM_getValue(nukePostOptions, nukePostDefaultConfigString));
            this.setValues(nukePostConfig);
        },
        [SAVE_NUKE_CONFIG.HANDLE_SAVE](ev: ActionEvent) {
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
        [SAVE_NUKE_CONFIG.HANDLE_RESET](ev: ActionEvent) {
            ev.preventDefault();
            const defaultConfig: CmNukePostConfig = JSON.parse(nukePostDefaultConfigString);
            this.setValues(defaultConfig);
        }
    });
}
