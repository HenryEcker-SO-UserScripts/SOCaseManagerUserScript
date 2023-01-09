import {buildClientSideAuthModal} from './Components/ClientSideAuthFlow';
import {accessToken} from './API/gmAPI';
import {buildAnswerControlPanel} from './Components/PostControlPanel/PostControlPanelMain';
import {buildUserScriptSettingsNav} from './Components/UserScriptControls/UserScriptControlsMain';
import {buildProfilePage} from './Components/UserProfile/UserProfileMain';
import {buildPlagiaristTab} from './Components/UserSearch/UserSearchMain';

function UserScript() {
    // API TOKEN IS REQUIRED
    if (GM_getValue(accessToken, null) === null) {
        buildClientSideAuthModal();
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

StackExchange.ready(() => {
    UserScript();
});