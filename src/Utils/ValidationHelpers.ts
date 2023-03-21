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
        max: 200
    } as ValidationBounds,
    commentTextarea: {
        min: 15,
        max: 600
    } as ValidationBounds
};


export function isInValidationBounds(textLength: number, vB: ValidationBounds) {
    return textLength < vB.min || textLength > vB.max;
}