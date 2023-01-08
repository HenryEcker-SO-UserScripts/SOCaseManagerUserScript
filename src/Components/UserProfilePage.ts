import {fetchFromAWS} from '../AWSAPI';
import {buildAlertSvg} from '../SVGBuilders';
import {CaseManagerControlPanel} from './CaseManagerControlPanel';
import {buildAnswerSummaryIndicator} from './UserProfileAnswerSummaryIndicator';


export function buildProfilePage() {
    const userId = getUserIdFromWindowLocation();
    const {tabContainer, navButton} = buildProfileNavPill(userId);

    if (window.location.search.startsWith(tabIdentifiers.userSummary)) {
        const selectedClass = 'is-selected';
        // Make nav the only active class
        tabContainer.find('a').removeClass(selectedClass);
        navButton.addClass(selectedClass);
        /***
         * Mods default to ?tab=activity while everyone else defaults to ?tab=profile
         * That is why the selector is the last div in #mainbar-full instead of #main-content
         */
        // Blank the content to make room for the UserScript
        $('#mainbar-full > div:last-child').replaceWith(new CaseManagerControlPanel(userId).init());
    } else if (window.location.search.startsWith(tabIdentifiers.userAnswers)) {
        buildAnswerSummaryIndicator();
    }
}


function getUserIdFromWindowLocation() {
    const patternMatcher = window.location.pathname.match(/^\/users\/\d+/g) || window.location.pathname.match(/^\/users\/account-info\/\d+/g);
    if (patternMatcher === null || patternMatcher.length !== 1) {
        throw Error('Something changed in user path!');
    }
    return Number(patternMatcher[0].split('/').at(-1));
}

function buildProfileNavPill(userId: number) {
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
    return {
        tabContainer,
        navButton
    };
}

