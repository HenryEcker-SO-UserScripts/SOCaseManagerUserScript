import {buildUserScriptSettingsPanel} from './Settings';

export function buildUserScriptSettingsNav() {
    addSettingsNavLink();
    if (window.location.search.startsWith(tabIdentifiers.settings)) {
        buildAndAttachSettingsPanel();
    }
}

function addSettingsNavLink() {
    $('.user-show-new .s-navigation:eq(0)') // Nav buttons on left
        .append(
            // Add Nav button to case manager Settings
            $(`<a href="${window.location.pathname}${tabIdentifiers.settings}" class="s-navigation--item">Case Manager Settings</a>`)
        );
}

function buildAndAttachSettingsPanel() {
    $('#mainbar-full')
        .empty() // Empty before request (to indicate immediately indicate the page will render)
        .append(buildUserScriptSettingsPanel());
}