import {seApiToken} from './gmAPI';

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
            isModerator: boolean;
        };
    };
    helpers: {
        showConfirmModal: (options: ShowConfirmModalOptions) => Promise<boolean>;
        showToast: (message: string, options?: showToastOptions) => void;
    };
    ready: (onReady: () => void) => void;
}

export interface PostDeleteResponse {
    Success: boolean;
    Reason: number;
    Warning: boolean;
    NewScore: number;
    Message: string;
    CanOverrideMessageWithResearchPrompt: boolean;
    Refresh: boolean;
    Transient: boolean;
    Info: boolean;
    HasAcceptedByModRights: boolean;
}

export interface FlagOtherResponse {
    FlagType: number;
    Message: string;
    Outcome: number;
    ResultChangedState: boolean;
    Success: boolean;
}


export interface SEAPIResponse<T> {
    has_more: boolean;
    items: T[];
    quota_max: number;
    quota_remaining: number;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export function fetchFromSEAPI(path: string, search: string): Promise<Response> {
    const usp = new URLSearchParams(search);
    usp.set('site', 'stackoverflow');
    usp.set('key', seApiDefs.apiKey);
    usp.set('access_token', GM_getValue(seApiToken));
    return fetch(`${seApiDefs.seAPIBase}${path}?${usp.toString()}`);
}