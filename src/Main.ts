import {startAuthFlow} from './ClientSideAuthFlow';
import {accessToken} from './gmAPI';
import {buildAnswerControlPanel} from './Components/PostControlPanel/PostControlPanelMain';
import {buildUserScriptSettingsNav} from './Components/UserScriptControls/UserScriptControlsMain';
import {buildProfilePage} from './Components/UserProfile/UserProfileMain';
import {buildPlagiaristTab} from './Components/UserSearch/UserSearchMain';

StackExchange.ready(() => {
    UserScript();
});

function UserScript() {
    // API TOKEN IS REQUIRED
    if (GM_getValue(accessToken, null) === null) {
        startAuthFlow();
        return; // Nothing else is allowed to run without valid auth
    }

    if (window.location.pathname.match(/^\/questions\/.*/) !== null) {
        buildAnswerControlPanel();
    } else if (window.location.pathname.match(/^\/users$/) !== null) {
        buildPlagiaristTab();
    } else if (window.location.pathname.match(new RegExp(`^/users/${StackExchange.options.user.userId}.*`)) !== null) {
        buildUserScriptSettingsNav();
    } else if (window.location.pathname.match(/^\/users\/.*/) !== null) {
        buildProfilePage();
    }
}