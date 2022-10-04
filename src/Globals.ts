/**
 * Modal Options can have:
 *   - title OR titleHtml but not both [required]
 *   - body OR bodyHtml but not both [required]
 *   - neither buttonLabel NOR buttonLabelHtml [optional] OR either buttonLabel OR buttonLabelHtml but not both
 */
type ShowConfirmModalOptions =
    ({ title: string; titleHtml?: never; } | { title?: never; titleHtml: string; })
    & ({ body: string; bodyHtml?: never; } | { body?: never; bodyHtml: string; })
    & ({ buttonLabel?: string; buttonLabelHtml?: never; } | { buttonLabel?: never; buttonLabelHtml: string; });


interface showToastOptions {
    dismissable?: boolean;
    transient?: boolean;
    useRawHtml?: boolean;
    transientTimeout?: number;
    type?: 'info' | 'success' | 'warning' | 'danger';
}

export interface StackExchangeAPI {
    options: {
        user: {
            fkey: string;
            userId: number;
        };
    };
    helpers: {
        showConfirmModal: (options: ShowConfirmModalOptions) => Promise<boolean>;
        showToast: (message: string, options?: showToastOptions) => void;
    };
    ready: (onReady: () => void) => void;
}

export const buildAlertSvg = (dim = 18, viewBox = 18) => `<svg aria-hidden="true" class="svg-icon iconAlert" width="${dim}" height="${dim}" viewBox="0 0 ${viewBox} ${viewBox}"><path d="M7.95 2.71c.58-.94 1.52-.94 2.1 0l7.69 12.58c.58.94.15 1.71-.96 1.71H1.22C.1 17-.32 16.23.26 15.29L7.95 2.71ZM8 6v5h2V6H8Zm0 7v2h2v-2H8Z"></path></svg>`;
export const buildCaseSvg = (dim = 18, viewBox = 18) => `<svg aria-hidden="true" class="svg-icon iconBriefcase" width="${dim}" height="${dim}" viewBox="0 0 ${viewBox} ${viewBox}"><path d="M5 4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7c0-1.1.9-2 2-2h1V4Zm7 0H6v1h6V4Z"></path></svg>`;


export const accessTokenGmStorageKey = 'access_token';
export const seApiTokenGmStorageKey = 'se_api_token';
export const userCaseManagerTabIdentifier = '?tab=case-manager';
export const userCaseManagerSettingsTabIdentifier = '?tab=case-manager-settings';
export const userAnswerTabProfile = '?tab=answers';
export const casesTab = '?tab=case';

const authRedirectUri = 'https://4shuk8vsp8.execute-api.us-east-1.amazonaws.com/prod/auth/se/oauth';
export const seTokenAuthRoute = `https://stackoverflow.com/oauth?client_id=24380&scope=no_expiry&redirect_uri=${authRedirectUri}`;

