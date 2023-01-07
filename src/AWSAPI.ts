import {accessToken, seApiToken} from './gmAPI';

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

export interface SummaryPostActionResponse {
    [postId: string]: number[]; // "postId": [1,2,3,4,5] <- array of action Ids
}

export const requestNewJwt = () => {
    return fetchFromAWS('/auth/cm/jwt',
        {
            'method': 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({'se_api_token': GM_getValue(seApiToken)})
        },
        false
    )
        .then(res => res.json())
        .then(resData => {
            GM_setValue(accessToken, resData['cm_access_token']);
        })
        .catch(err => {
            // Remove current access token on error (maybe not great)
            GM_deleteValue(accessToken);
            console.error(err);
        });
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export const fetchFromAWS = (path: string, options?: RequestInit, withCredentials = true): Promise<Response> => {
    // Always send access_token along
    let newOptions: RequestInit = withCredentials ? {
        'headers': {
            'access_token': GM_getValue(accessToken)
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
    return fetch(`${awsApiDefs.awsApiBase}${path}`, newOptions).then(res => {
        if (res.status === 401) { // jwt is expired so attempt to automatically retrieve a new one
            return requestNewJwt().then(() => fetchFromAWS(path, options));
        }
        return res;
    });
};


export const getSummaryPostInfoFromIds = (ids: { join: (s: string) => string; }): Promise<Set<number>> => {
    return fetchFromAWS(`/summary/posts/${ids.join(';')}`)
        .then(res => res.json() as Promise<number[]>)
        .then(postIds => {
            return Promise.resolve(new Set(postIds));
        });
};

export const getSummaryPostActionsFromIds = (ids: { join: (s: string) => string; }): Promise<SummaryPostActionResponse> => {
    return fetchFromAWS(`/summary/posts/${ids.join(';')}/actions`)
        .then(res => res.json() as Promise<SummaryPostActionResponse>)
        .then(postActionData => {
            return Promise.resolve(postActionData);
        });
};

export const seTokenAuthRoute = awsApiDefs.seTokenAuth;