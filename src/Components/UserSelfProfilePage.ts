import {buildUserScriptSettingsPanel} from './Settings';


export function buildCurrentUserProfilePage() {
    $('.user-show-new .s-navigation:eq(0)') // Nav buttons on left
        .append(
            // Add Nav button to case manager Settings
            $(`<a href="${window.location.pathname}${tabIdentifiers.settings}" class="s-navigation--item">Case Manager Settings</a>`)
        );
    if (window.location.search.startsWith(tabIdentifiers.settings)) {
        $('#mainbar-full')
            .empty() // Empty before request (to indicate immediately indicate the page will render)
            .append(buildUserScriptSettingsPanel());
    }
}