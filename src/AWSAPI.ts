import {accessTokenGmStorageKey, seApiTokenGmStorageKey} from './Globals';

export type CaseSummaryPostSummary = {
    action_taken: string;
    number_of_posts: number;
}[];

export type CaseSummaryCaseTimeline = {
    case_event_id: number;
    case_event_description: string;
    case_event_type_id: number;
    account_id: number;
    display_name: string;
    event_creation_date: string;
}[];

export interface CaseSummaryPageResponse {
    hasOpenCase: boolean;
    postSummary: CaseSummaryPostSummary;
    caseTimeline: CaseSummaryCaseTimeline;
}

export interface CaseStateChangeResponse {
    hasOpenCase: boolean;
    message: string;
}

export interface CasePostDetailResponse {
    header: string[];
    body: ((number | null)[])[];
}

export interface CaseGroupEntry {
    group_id: string;
    description: string;
}

export interface UserCaseSummaryEntry {
    display_name: string;
    profile_image: null | string;
    investigated_user_id: number;
    event_creation_date: string;
    current_state: string;
}

export interface OpenCasesSummaryPageResponse {
    totalPages?: number;
    groupInfo?: CaseGroupEntry[];
    cases: UserCaseSummaryEntry[];
}

export const requestNewJwt = () => {
    return fetchFromAWS('/auth/cm/jwt',
        {
            'method': 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({'se_api_token': GM_getValue(seApiTokenGmStorageKey)})
        },
        false
    )
        .then(res => res.json())
        .then(resData => {
            GM_setValue(accessTokenGmStorageKey, resData['cm_access_token']);
        })
        .catch(err => {
            // Remove current access token on error (maybe not great)
            GM_deleteValue(accessTokenGmStorageKey);
            console.error(err);
        });
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export const fetchFromAWS = (path: string, options?: RequestInit, withCredentials = true): Promise<Response> => {
    // Always send access_token along
    let newOptions: RequestInit = withCredentials ? {
        'headers': {
            'access_token': GM_getValue(accessTokenGmStorageKey)
        }
    } : {};
    if (options !== undefined) {
        newOptions = {
            ...options,
            'headers': {
                ...options['headers'],
                ...newOptions['headers']
            }
        };
    }
    return fetch(`https://4shuk8vsp8.execute-api.us-east-1.amazonaws.com/prod${path}`, newOptions).then(res => {
        if (res.status === 401) { // jwt is expired so attempt to automatically retrieve a new one
            return requestNewJwt().then(() => fetchFromAWS(path, options));
        }
        return res;
    });
};


export const getSummaryPostInfoFromIds = (ids: { join: (s: string) => string; }): Promise<Set<number>> => {
    // return Promise.resolve(new Set([72950666]));
    return fetchFromAWS(`/summary/posts/${ids.join(';')}`)
        .then(res => res.json() as Promise<number[]>)
        .then(postIds => {
            return Promise.resolve(new Set(postIds));
        });
};