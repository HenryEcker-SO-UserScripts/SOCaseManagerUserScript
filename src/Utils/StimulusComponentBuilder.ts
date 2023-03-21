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


export function buildCheckbox(labelText: string, inputId: string, dataController: string, dataTarget: string, isChecked: boolean) {
    return `
<div class="s-check-control">
    <input class="s-checkbox" type="checkbox" id="${inputId}" data-${dataController}-target="${dataTarget}"${isChecked ? ' checked' : ''}/>
    <label class="s-label" for="${inputId}">${labelText}</label>
</div>`;
}

export function buildToggle(labelText: string, inputId: string, dataController: string, dataTarget: string, isChecked: boolean, extraInputAttrs?: string) {
    return `
<div class="d-flex ai-center g8 jc-space-between">
    <label class="s-label" for="${inputId}">${labelText}</label>
    <input class="s-toggle-switch" 
           id="${inputId}"
           data-${dataController}-target="${dataTarget}"
            ${extraInputAttrs ?? ''}
           type="checkbox"${isChecked ? ' checked' : ''}>
</div>`;
}

export function buildTextarea(
    textareaId: string | number, textareaName: string, textareaText: string, rows: string | number,
    dataController: string, dataTarget: string,
    labelText: string,
    vB: ValidationBounds
) {
    return `
<div class="d-flex ff-column-nowrap gs4 gsy" 
     data-controller="se-char-counter"
     data-se-char-counter-min="${vB.min}"
     data-se-char-counter-max="${vB.max}">
     <label class="s-label flex--item" for="${textareaId}">${labelText}</label>
     <textarea class="flex--item s-textarea" 
               data-se-char-counter-target="field" 
               data-is-valid-length="false" 
               id="${textareaId}" 
               name="${textareaName}" 
               rows="${rows}" 
               data-${dataController}-target="${dataTarget}">${textareaText ?? ''}</textarea>
     <div data-se-char-counter-target="output"></div>
</div>`;
}