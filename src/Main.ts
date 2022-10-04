import type {StackExchangeAPI,} from './Globals';
import {
    accessTokenGmStorageKey, buildAlertSvg,
    casesTab,
    userAnswerTabProfile,
    userCaseManagerSettingsTabIdentifier,
    userCaseManagerTabIdentifier
} from './Globals';
import {buildAnswerControlPanel} from './Scripts/AnswerControlPanel';
import {startAuthFlow} from './ClientSideAuthFlow';
import {buildAnswerSummaryIndicator} from './Scripts/ProfileAnswerSummaryIndicator';
import {CaseManagerControlPanel} from './Scripts/CaseManagerControlPanel';
import {CasesUserList} from './Scripts/CasesList';
import {buildUserScriptSettingsPanel} from './Scripts/UserScriptSettings';
import {fetchFromAWS} from './AWSAPI';

declare const StackExchange: StackExchangeAPI;


const UserScript = () => {
    // API TOKEN IS REQUIRED
    if (GM_getValue(accessTokenGmStorageKey, null) === null) {
        startAuthFlow();
        return; // Nothing else is allowed to run without valid auth
    }
    const currentUserProfilePattern = new RegExp(`^/users/${StackExchange.options.user.userId}.*`);

    if (window.location.pathname.match(/^\/questions\/.*/) !== null) {
        void buildAnswerControlPanel();
    } else if (window.location.pathname.match(/^\/users$/) !== null) {
        const primaryUsersNav = $('.js-filter-btn');
        const a = $(`<a class="js-sort-preference-change flex--item s-btn s-btn__muted s-btn__outlined" href="/users${casesTab}" data-nav-xhref="" title="Users who have been or are currently under investigation" data-value="plagiarist" data-shortcut="">Plagiarists</a>`);
        primaryUsersNav.append(a);
        if (window.location.search.startsWith(casesTab)) {
            const cmUserCaseSummaryPage = new CasesUserList();
            cmUserCaseSummaryPage.init();
        }
    } else if (window.location.pathname.match(currentUserProfilePattern) !== null) {
        const navButton = $(`<a href="${window.location.pathname}${userCaseManagerSettingsTabIdentifier}" class="s-navigation--item">Case Manager Settings</a>`);
        const tabContainer = $('.user-show-new .s-navigation:eq(0)');
        tabContainer.append(navButton);
        if (window.location.search.startsWith(userCaseManagerSettingsTabIdentifier)) {
            const mainPanel = $('#mainbar-full');
            void buildUserScriptSettingsPanel().then(c => {
                mainPanel.empty().append(c);
            });
        }
    } else if (window.location.pathname.match(/^\/users\/.*/) !== null) {
        const userPath = window.location.pathname.match(/^\/users\/\d+/g);
        if (userPath === null || userPath.length !== 1) {
            throw Error('Something changed in user path!');
        }
        const userId = Number(userPath[0].split('/')[2]);

        const navButton = $(`<a href="${window.location.pathname}${userCaseManagerTabIdentifier}" class="s-navigation--item">Case Manager</a>`);
        void fetchFromAWS(`/case/user/${userId}`)
            .then(res => res.json())
            .then((resData: { is_known_user: boolean; }) => {
                if (resData['is_known_user']) {
                    navButton.prepend(buildAlertSvg(16, 20));
                }
            });
        const tabContainer = $('.user-show-new .s-navigation:eq(0)');
        tabContainer.append(navButton);


        if (window.location.search.startsWith(userCaseManagerTabIdentifier)) {
            const selectedClass = 'is-selected';
            // Make nav the only active class
            tabContainer.find('a').removeClass(selectedClass);
            navButton.addClass(selectedClass);
            // Blank the content to make room for the UserScript
            const mainPanel = $('#main-content');
            const cmUserControlPanel = new CaseManagerControlPanel(userId);
            mainPanel.empty().append(cmUserControlPanel.init());
        } else if (window.location.search.startsWith(userAnswerTabProfile)) {
            buildAnswerSummaryIndicator();
        }
    }
};

StackExchange.ready(() => {
    UserScript();
});