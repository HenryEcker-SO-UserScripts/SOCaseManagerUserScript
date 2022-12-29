import {fetchFromAWS, seTokenAuthRoute} from '../AWSAPI';
import {type StackExchangeAPI} from '../SEAPI';
import {accessToken, commentDetailTextBase, seApiToken} from '../gmAPI';


declare const StackExchange: StackExchangeAPI;

export const buildUserScriptSettingsPanel = async () => {
    const tokens: string[] = await fetchFromAWS('/auth/credentials').then(res => res.json());

    const container = $('<div></div>');
    container.append('<div class="s-page-title mb24"><h1 class="s-page-title--header m0 baw0 p0">Case Manager UserScript Settings</h1></div>');
    const toolGrid = $('<div class="d-grid grid__2 md:grid__1 g32"></div>');
    container.append(toolGrid);

    {
        const existingTokensComponent = $('<div></div>');
        toolGrid.append(existingTokensComponent);

        existingTokensComponent.append('<h3 class="fs-title mb12">Existing Auth Tokens</h3>');
        const tokenList = $('<div></div>');
        existingTokensComponent.append(tokenList);

        // Token Invalidator
        tokens.forEach((token) => {
            const tokenRow = $('<div class="d-flex fd-row ai-center"></div>');
            tokenList.append(tokenRow);

            tokenRow.append(`<span>${token}</span>`);
            const invalidateButton = $('<button class="s-btn s-btn__danger">Invalidate</button>');
            invalidateButton.on('click', (ev) => {
                ev.preventDefault();
                void fetchFromAWS(`/auth/credentials/${token}/invalidate`).then((res) => {
                    if (res.status === 200) {
                        // Get rid of the row from the table
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
            tokenRow.append(invalidateButton);
        });

        const deAuthoriseButton = $('<button class="s-btn s-btn__outlined s-btn__danger mt16" id="app-24380">De-authenticate Application</button>');
        existingTokensComponent.append(deAuthoriseButton);

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
    }

    // Token Issuer
    {
        const getNewToken = $('<div></div>');
        toolGrid.append(getNewToken);

        getNewToken.append('<h3 class="fs-title mb12">Issue new token</h3>');
        getNewToken.append('<p>You can issue a new auth token for use on another device or to manually replace an existing token. Please invalidate any existing tokens, so they can no longer be used to access your information.</p>');
        getNewToken.append(`<a class="s-link s-link__underlined" href="${seTokenAuthRoute}" target="_blank" rel="noopener noreferrer">Issue new auth token</a>`);
    }


    // Flag base template manager
    {
        const templateIssuer = $('<div></div>');
        toolGrid.append(templateIssuer);

        templateIssuer.append('<h3 class="fs-title mb12">Edit base message template for comment/flags</h3>');
        const templateForm = $('<form></form>');
        const textarea: JQuery<HTMLInputElement> = $(`<textarea class="s-textarea js-comment-text-input">${GM_getValue(commentDetailTextBase, '')}</textarea>`);
        templateForm.append(textarea);
        templateForm.append('<button class="s-btn s-btn__primary" type="submit">Submit</button>');

        const formHandler = (ev: JQuery.Event) => {
            ev.preventDefault();
            const v = textarea.val() as string;
            if (v.length === 0) {
                GM_deleteValue(commentDetailTextBase);
                StackExchange.helpers.showToast('Base detail text removed successfully.', {
                    type: 'info',
                    transientTimeout: 3000
                });
            } else {
                GM_setValue(commentDetailTextBase, textarea.val());
                StackExchange.helpers.showToast('Base detail text updated successfully!', {
                    type: 'success',
                    transientTimeout: 3000
                });
            }
        };
        templateForm.on('submit', formHandler);

        templateIssuer.append(templateForm);
    }

    return container;
};