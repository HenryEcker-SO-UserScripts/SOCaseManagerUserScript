import {seApiToken} from './gmAPI';

// Currently relying on 200 status code since it sometimes returns an HTML response and sometimes JSON
// Depending on if the CM escalate message was displayed or not.
// export interface PostDeleteAsPlagiarismResponse {
//     success: boolean;
//     message: string;
// }

export interface FlagPlagiarismResponse {
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