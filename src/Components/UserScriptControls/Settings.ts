import {roleIdToken} from '../../API/gmAPI';
import {buildAuthRoleDetails} from './SettingControls/AuthRoleInformation';
import {buildTokenIssuer} from './SettingControls/AuthTokenIssuer';
import {buildExistingTokensControls} from './SettingControls/ExistingAuthTokenManager';
import {buildNukeConfigControls} from './SettingControls/NukeDefaultConfigControls';


export function buildUserScriptSettingsPanel() {
    const container = $('<div class="s-page-title mb24"><h1 class="s-page-title--header m0 baw0 p0">Case Manager UserScript Settings</h1></div>');
    const toolGrid = $('<div class="d-grid grid__2 md:grid__1 g32"></div>');

    toolGrid.append(buildExistingTokensControls());
    toolGrid.append(buildTokenIssuer());
    if (GM_getValue<number>(roleIdToken) <= RoleIds.Investigator && StackExchange.options.user.isModerator) {
        toolGrid.append(buildNukeConfigControls());
    }
    toolGrid.append(buildAuthRoleDetails());

    return $(document.createDocumentFragment())
        .append(container)
        .append(toolGrid);
}