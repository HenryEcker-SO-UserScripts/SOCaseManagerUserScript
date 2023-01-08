import {fetchFromAWS} from './AWSAPI';
import {startAuthFlow} from './ClientSideAuthFlow';
import {accessToken} from './gmAPI';
import {buildAnswerControlPanel} from './Scripts/AnswerControlPanel';
import {CaseManagerControlPanel} from './Scripts/CaseManagerControlPanel';
import {CasesUserList} from './Scripts/CasesList';
import {buildAnswerSummaryIndicator} from './Scripts/ProfileAnswerSummaryIndicator';
import {buildUserScriptSettingsPanel} from './Scripts/UserScriptSettings';
import {type StackExchangeAPI} from './SEAPI';
import {buildAlertSvg} from './SVGBuilders';

declare const StackExchange: StackExchangeAPI;


const UserScript = () => {
    // API TOKEN IS REQUIRED
    if (GM_getValue(accessToken, null) === null) {
        startAuthFlow();
        return; // Nothing else is allowed to run without valid auth
    }
    const currentUserProfilePattern = new RegExp(`^/users/${StackExchange.options.user.userId}.*`);

    if (window.location.pathname.match(/^\/questions\/.*/) !== null) {
        void buildAnswerControlPanel();
    } else if (window.location.pathname.match(/^\/users$/) !== null) {
        const primaryUsersNav = $('.js-filter-btn');
        const a = $(`<a class="js-sort-preference-change flex--item s-btn s-btn__muted s-btn__outlined" href="/users${tabIdentifiers.cases}" data-nav-xhref="" title="Users who have been or are currently under investigation" data-value="plagiarist" data-shortcut="">Plagiarists</a>`);
        primaryUsersNav.append(a);
        if (window.location.search.startsWith(tabIdentifiers.cases)) {
            const cmUserCaseSummaryPage = new CasesUserList();
            cmUserCaseSummaryPage.init();
        }
    } else if (window.location.pathname.match(currentUserProfilePattern) !== null) {
        const navButton = $(`<a href="${window.location.pathname}${tabIdentifiers.settings}" class="s-navigation--item">Case Manager Settings</a>`);
        const tabContainer = $('.user-show-new .s-navigation:eq(0)');
        tabContainer.append(navButton);
        if (window.location.search.startsWith(tabIdentifiers.settings)) {
            const mainPanel = $('#mainbar-full');
            mainPanel.empty(); // Empty before request (to indicate immediately indicate the page will render)
            void buildUserScriptSettingsPanel().then(c => {
                mainPanel.append(c);
            });
        }
    } else if (window.location.pathname.match(/^\/users\/.*/) !== null) {
        const userPath = window.location.pathname.match(/^\/users\/\d+/g);
        if (userPath === null || userPath.length !== 1) {
            throw Error('Something changed in user path!');
        }
        const userId = Number(userPath[0].split('/')[2]);

        const navButton = $(`<a href="${window.location.pathname}${tabIdentifiers.userSummary}" class="s-navigation--item">Case Manager</a>`);
        void fetchFromAWS(`/case/user/${userId}`)
            .then(res => res.json())
            .then((resData: { is_known_user: boolean; }) => {
                if (resData['is_known_user']) {
                    navButton.prepend(buildAlertSvg(16, 20));
                }
            });
        const tabContainer = $('.user-show-new .s-navigation:eq(0)');
        tabContainer.append(navButton);


        if (window.location.search.startsWith(tabIdentifiers.userSummary)) {
            const selectedClass = 'is-selected';
            // Make nav the only active class
            tabContainer.find('a').removeClass(selectedClass);
            navButton.addClass(selectedClass);
            /***
             * Mods default to ?tab=activity while everyone else defaults to ?tab=profile
             * That is why the selector is the last div in #mainbar-full instead of #main-content
             */
            const mainPanel = $('#mainbar-full > div:last-child');
            const cmUserControlPanel = new CaseManagerControlPanel(userId);
            // Blank the content to make room for the UserScript
            mainPanel.replaceWith(cmUserControlPanel.init());
        } else if (window.location.search.startsWith(tabIdentifiers.userAnswers)) {
            buildAnswerSummaryIndicator();
        }
    }
};

StackExchange.ready(() => {
    UserScript();
});