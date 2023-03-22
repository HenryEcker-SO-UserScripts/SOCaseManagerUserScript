export const accessToken = 'access_token';
export const seApiToken = 'se_api_token';


export interface CmNukePostConfig {
    flagDetailText: string;
    commentText: string;
    flag: boolean;
    comment: boolean;
    log: boolean;
}

export const nukePostDefaultConfigString = JSON.stringify({
    flagDetailText: '',
    commentText: '',
    flag: false,
    comment: false,
    log: true
} as CmNukePostConfig);
export const nukePostOptions = 'cm_nuke_post_config';