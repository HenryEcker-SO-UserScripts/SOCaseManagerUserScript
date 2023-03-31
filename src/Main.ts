import {accessToken} from './API/gmAPI';
import {buildClientSideAuthModal} from './Components/ClientSideAuthFlow';
import {buildAnswerControlPanel} from './Components/PostControlPanel/PostControlPanelMain';
import {buildProfilePage} from './Components/UserProfile/UserProfileMain';
import {buildUserScriptSettingsNav} from './Components/UserScriptControls/UserScriptControlsMain';
import {buildPlagiaristTab} from './Components/UserSearch/UserSearchMain';

async function UserScript() {
    // API TOKEN IS REQUIRED
    if (GM_getValue(accessToken, null) === null) {
        buildClientSideAuthModal();
        return; // Nothing else is allowed to run without valid auth
    }

    if (window.location.pathname.match(/^\/questions\/.*/) !== null) {
        buildAnswerControlPanel();
    } else if (window.location.pathname.match(/^\/users$/) !== null) {
        buildPlagiaristTab();
    } else if (window.location.pathname.match(new RegExp(`^/users/(account-info/)?${StackExchange.options.user.userId}.*`)) !== null) {
        buildUserScriptSettingsNav();
    } else if (window.location.pathname.match(/^\/users\/.*/) !== null) {
        buildProfilePage();
    }
}

StackExchange.ready(() => {
    void UserScript();
});