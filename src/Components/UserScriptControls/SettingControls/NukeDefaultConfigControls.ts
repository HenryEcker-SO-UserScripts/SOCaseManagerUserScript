import {type CmNukePostConfig, nukePostDefaultConfigString, nukePostOptions} from '../../../API/gmAPI';
import {buildNukeOptionElements, getCheckboxValuesFromInput} from '../../PostControlPanel/PostModTools';
import {getMessageFromCaughtElement} from '../../../Utils/ErrorHandlingHelpers';

export function buildNukeConfigControls(): JQuery {
    return $('<div></div>')
        .append('<h3 class="fs-title mb12">Edit base options for nuking posts</h3>')
        .append(buildTemplateForm());
}

function buildTemplateForm() {
    const nukePostConfig: CmNukePostConfig = JSON.parse(GM_getValue(nukePostOptions, nukePostDefaultConfigString));
    const templateForm = $('<form class="d-flex fd-column g8"></form>');
    const {
        textareaLabel,
        textarea,
        checkboxContainer,
        shouldFlagCheckbox,
        shouldCommentCheckbox,
        shouldLogCheckbox
    } = buildNukeOptionElements('nuke-config', nukePostConfig);

    templateForm.on('submit', function (ev: JQuery.Event) {
        ev.preventDefault();
        try {
            const [
                isFlagChecked,
                isCommentChecked,
                isLogChecked
            ] = getCheckboxValuesFromInput(shouldFlagCheckbox, shouldCommentCheckbox, shouldLogCheckbox);

            const newConfig: CmNukePostConfig = {
                detailText: (textarea.val() as string | undefined) || '',
                flag: isFlagChecked,
                comment: isCommentChecked,
                log: isLogChecked,
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
    });

    return templateForm
        .append(textareaLabel)
        .append(textarea)
        .append(checkboxContainer)
        .append('<div><button class="s-btn s-btn__primary" type="submit">Save Config</button></div>');
}

