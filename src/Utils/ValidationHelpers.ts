export interface ValidationBounds {
    min?: number;
    max?: number;
}


export const validationBounds = {
    flagDetailTextarea: {
        min: 10,
        max: 500
    } as ValidationBounds,
    flagOriginalSourceTextarea: {
        min: 10,
        // max: 500 // 500 is a best guess (https://chat.stackoverflow.com/transcript/message/56121710), but there's no character counter here so it's unknown
    } as ValidationBounds,
    commentTextarea: {
        min: 15,
        max: 600
    } as ValidationBounds
};


export function isInValidationBounds(textLength: number, vB: ValidationBounds) {
    const min = vB.min ?? 0;
    if (vB.max === undefined) {
        return min <= textLength;
    }
    return min <= textLength && textLength <= vB.max;
}