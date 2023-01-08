import {startAuthFlow} from './ClientSideAuthFlow';
import {accessToken} from './gmAPI';
import {buildAnswerControlPanel} from './Components/AnswerControlPanel/AnswerControlPanel';
import {buildCurrentUserProfilePage} from './Components/UserSelfProfilePage';
import {buildProfilePage} from './Components/UserProfilePage';
import {buildPlagiaristTab} from './Components/UserSearchPage';
import {type StackExchangeAPI} from './SEAPI';

declare const StackExchange: StackExchangeAPI;


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
        buildCurrentUserProfilePage();
    } else if (window.location.pathname.match(/^\/users\/.*/) !== null) {
        buildProfilePage();
    }
}