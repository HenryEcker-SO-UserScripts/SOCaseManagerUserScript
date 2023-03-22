export interface ValidationBounds {
    min: number;
    max: number;
}


export const validationBounds = {
    flagDetailTextarea: {
        min: 10,
        max: 500
    } as ValidationBounds,
    flagLinkTextarea: {
        min: 10,
        max: 500 // 500 is a best guess (https://chat.stackoverflow.com/transcript/message/56121710), but there's no character counter here so it's unknown
    } as ValidationBounds,
    commentTextarea: {
        min: 15,
        max: 600
    } as ValidationBounds
};


export function isInValidationBounds(textLength: number, vB: ValidationBounds) {
    return textLength < vB.min || textLength > vB.max;
}