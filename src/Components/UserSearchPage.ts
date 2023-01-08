import {CasesUserList} from './CasesList';

export function buildPlagiaristTab() {
    // User Filter Buttons
    $('.js-filter-btn')
        .append(
            // Add additional button for Plagiarist
            $(`<a class="js-sort-preference-change flex--item s-btn s-btn__muted s-btn__outlined" href="/users${tabIdentifiers.cases}" data-nav-xhref="" title="Users who have been or are currently under investigation" data-value="plagiarist" data-shortcut="">Plagiarists</a>`)
        );
    // If on that page build display users
    if (window.location.search.startsWith(tabIdentifiers.cases)) {
        new CasesUserList().init();
    }
}