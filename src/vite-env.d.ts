// Should match the "define:" section of vite-shared-config.js
declare const tabIdentifiers: {
    settings: string;
    userSummary: string;
    userAnswers: string;
    cases: string;
};

declare const awsApiDefs: {
    awsApiBase: string;
    seTokenAuth: string;
};

declare const seApiDefs: {
    seAPIBase: string;
    apiKey: string;
};

declare const searchParamKeys: {
    page: string;
    group: string;
    search: string;
    tableFilter: string;
    tab: string;
};

declare const Feedback: {
    LooksOK: number;
    Edited: number;
    Plagiarised: number;
    Deleted: number;
    Suspicious: number;
};

// Pre Built HTML Components
declare const NUKE_POST_FORM: string;
declare const NUKE_POST_FORM_CONTROLLER: string;
declare const NUKE_POST_FORM_MODAL_ID: string;
declare const NUKE_POST_DATA_TARGETS: string[];
declare const NUKE_POST_ENABLE_FLAG_TOGGLE_TARGET: string;
declare const NUKE_POST_ENABLE_COMMENT_TOGGLE_TARGET: string;
declare const NUKE_POST_ENABLE_LOG_TOGGLE_TARGET: string;
declare const NUKE_POST_COMMENT_TEXT_TARGET: string;
declare const NUKE_POST_FLAG_LINK_TEXT_TARGET: string;
declare const NUKE_POST_FLAG_DETAIL_TEXT_TARGET: string;
declare const NUKE_POST_FLAG_CONTROL_FIELDS_TARGET: string;
declare const NUKE_POST_COMMENT_CONTROL_FIELDS_TARGET: string;


declare const NUKE_POST_SAVE_CONFIG_CONTROLLER:string;
declare const NUKE_POST_SAVE_CONFIG_FORM: string;
declare const NUKE_POST_SAVE_CONFIG_DATA_TARGETS: string[];
declare const NUKE_POST_SAVE_CONFIG_SHOULD_FLAG_TARGET: string;
declare const NUKE_POST_SAVE_CONFIG_SHOULD_COMMENT_TARGET: string;
declare const NUKE_POST_SAVE_CONFIG_SHOULD_LOG_TARGET: string;
declare const NUKE_POST_SAVE_CONFIG_FLAG_DETAIL_TARGET: string;
declare const NUKE_POST_SAVE_CONFIG_COMMENT_TARGET: string;