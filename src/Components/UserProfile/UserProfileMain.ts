import {fetchFromAWS} from '../../API/AWSAPI';
import {buildAlertSvg} from '../../Utils/SVGBuilders';
import {buildAndAttachCaseManagerControlPanel} from './CaseManager';
import {buildAnswerSummaryIndicator} from './PostActionSummaryIcons';


export function buildProfilePage() {
    const userId = getUserIdFromWindowLocation();

    // Build Link on profile page (regardless of search params)
    buildLinkToCaseManager(userId);

    // Conditional Build with search params
    if (window.location.search.startsWith(tabIdentifiers.userSummary)) {
        buildAndAttachCaseManagerControlPanel(userId);
    } else if (window.location.search.startsWith(tabIdentifiers.userAnswers)) {
        buildAnswerSummaryIndicator();
    }
}

function getUserIdFromWindowLocation() {
    const patternMatcher = window.location.pathname.match(/^\/users\/(account-info\/)?\d+/g);
    if (patternMatcher === null || patternMatcher.length !== 1) {
        throw Error('Something changed in user path!');
    }
    return Number(patternMatcher[0].split('/').at(-1));
}

function buildLinkToCaseManager(userId: number) {
    const {tabContainer, navButton} = buildProfileNavPill(userId);

    const selectedClass = 'is-selected';
    // Make nav the only active class
    tabContainer
        .find('a')
        .removeClass(selectedClass);
    navButton
        .addClass(selectedClass);
}

function buildProfileNavPill(userId: number) {
    const navButton = $(`<a href="/users/${userId}/${tabIdentifiers.userSummary}" class="s-navigation--item">Case Manager</a>`);
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


