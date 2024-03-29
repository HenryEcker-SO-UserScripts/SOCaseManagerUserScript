import {seApiToken} from './gmAPI';

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