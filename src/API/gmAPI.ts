export const accessToken = 'access_token';
export const seApiToken = 'se_api_token';


export interface CmNukePostConfig {
    detailText: string;
    flag: boolean;
    comment: boolean;
    log: boolean;
}

export const nukePostDefaultConfigString = JSON.stringify({
    detailText: '',
    flag: false,
    comment: true,
    log: true
});
export const nukePostOptions = 'cm_nuke_post_config';