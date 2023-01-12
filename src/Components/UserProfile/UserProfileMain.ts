import {buildAndAttachCaseManagerControlPanel} from './CaseManager';
import {buildAnswerSummaryIndicator} from './PostActionSummaryIcons';


export function buildProfilePage() {
    if (window.location.search.startsWith(tabIdentifiers.userSummary)) {
        buildAndAttachCaseManagerControlPanel();
    } else if (window.location.search.startsWith(tabIdentifiers.userAnswers)) {
        buildAnswerSummaryIndicator();
    }
}


