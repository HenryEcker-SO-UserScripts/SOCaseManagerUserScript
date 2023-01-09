import {fetchFromAWS} from '../../../API/AWSAPI';
import {accessToken, seApiToken} from '../../../API/gmAPI';

export function buildExistingTokensControls(): JQuery {
    return $('<div></div>')
        .append('<h3 class="fs-title mb12">Existing Auth Tokens</h3>')
        .append(buildTokenList())
        .append(buildDeAuthoriseButton());
}

function buildTokenList() {
    // Start with loading indicator
    const tokenList = $('<div><div class="is-loading">Loading...</div></div>');

    // Make fetch request for credentials
    void fetchFromAWS('/auth/credentials')
        .then(res => res.json())
        .then((tokens: string[]) => {
            tokenList.empty(); // Clear out loading indicator

            tokens.forEach((token) => {
                tokenList.append(buildTokenRow(token));
            });
        });
    return tokenList;
}

function buildTokenRow(token: string) {
    const tokenRow = $('<div class="d-flex fd-row ai-center"></div>');

    const invalidateButton = $('<button class="s-btn s-btn__danger">Invalidate</button>');

    invalidateButton.on('click', (ev) => {
        ev.preventDefault();
        void fetchFromAWS(`/auth/credentials/${token}/invalidate`).then((res) => {
            if (res.status === 200) {
                // Delete the row from the table
                tokenRow.remove();
                if (GM_getValue(seApiToken) === token) {
                    // If invalidating the local storage key also remove from GM storage
                    GM_deleteValue(seApiToken);
                    GM_deleteValue(accessToken);
                    window.location.reload();
                }
            }
        });
    });
    return tokenRow
        .append(`<span>${token}</span>`)
        .append(invalidateButton);
}

function buildDeAuthoriseButton() {
    const deAuthoriseButton = $('<button class="s-btn s-btn__outlined s-btn__danger mt16" id="app-24380">De-authenticate Application</button>');
    deAuthoriseButton.on('click', (ev) => {
        ev.preventDefault();
        void StackExchange.helpers.showConfirmModal(
            {
                title: 'De-authenticate this Application',
                bodyHtml: '<p>Are you sure you want to de-authenticate this application? All existing access tokens will be invalidated and removed from storage. This app will no longer appear in your authorized applications list. You will no longer be able to use any existing access tokens and will need to reauthenticate to continue use.</p><p><b>Note:</b> All of your actions will be retained and associated to your user id even after de-authenticating. You may resume access at any time by authorising the application again.</p>',
                buttonLabel: 'De-authenticate',
            }
        ).then((confirm: boolean) => {
            if (confirm) {
                void fetchFromAWS(`/auth/credentials/${GM_getValue(seApiToken)}/de-authenticate`)
                    .then((res) => {
                        if (res.status === 200) {
                            // These are all now no longer valid
                            GM_deleteValue(seApiToken);
                            GM_deleteValue(accessToken);
                            window.location.reload();
                        }
                    });
            }
        });
    });
    return deAuthoriseButton;
}