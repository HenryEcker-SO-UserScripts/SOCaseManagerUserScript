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
declare const HANDLE_POST: {
    MOD_FORM: string;
    NON_MOD_FORM: string;
    MOD_FORM_MODAL_ID: string;
    NON_MOD_FORM_MODAL_ID: string;
    FORM_CONTROLLER: string;
    MOD_DATA_TARGETS: string[];
    NON_MOD_DATA_TARGETS: string[];
    ENABLE_FLAG_TOGGLE_TARGET: string;
    ENABLE_COMMENT_TOGGLE_TARGET: string;
    ENABLE_LOG_TOGGLE_TARGET: string;
    COMMENT_TEXT_TARGET: string;
    FLAG_ORIGINAL_SOURCE_TEXT_TARGET: string;
    FLAG_DETAIL_TEXT_TARGET: string;
    FLAG_CONTROL_FIELDS_TARGET: string;
    COMMENT_CONTROL_FIELDS_TARGET: string;
    HANDLE_NUKE_SUBMIT: string;
    HANDLE_FLAG_SUBMIT: string;
    HANDLE_CANCEL: string;
    HANDLE_UPDATE_CONTROLLED_FIELD: string;
};


declare const SAVE_NUKE_CONFIG: {
    CONTROLLER: string;
    FORM: string;
    DATA_TARGETS: string[];
    SHOULD_FLAG_TARGET: string;
    SHOULD_COMMENT_TARGET: string;
    SHOULD_LOG_TARGET: string;
    FLAG_DETAIL_TARGET: string;
    COMMENT_TARGET: string;
    HANDLE_SAVE: string;
    HANDLE_RESET: string;
};

