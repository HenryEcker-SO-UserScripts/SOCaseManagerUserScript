import {seApiToken} from './gmAPI';

// TODO Update this to reflect "Delete as plagiarism" response because it may differ!!
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

// TODO Update With Flag Plagiarism Response as it is no longer FlagOther!!
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