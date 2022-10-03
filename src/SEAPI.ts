import {seApiTokenGmStorageKey} from './Globals';


const apiKey = 'BkvRpNB*IzKMdjAcikc4jA((';

export interface SEAPIResponse<T> {
    has_more: boolean;
    items: T[];
    quota_max: number;
    quota_remaining: number;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const fetchFromSEAPI = (path: string, search: string): Promise<Response> => {
    const usp = new URLSearchParams(search);
    usp.set('site', 'stackoverflow');
    usp.set('key', apiKey);
    usp.set('access_token', GM_getValue(seApiTokenGmStorageKey));
    return fetch(`https://api.stackexchange.com/2.3${path}?${usp.toString()}`);
};