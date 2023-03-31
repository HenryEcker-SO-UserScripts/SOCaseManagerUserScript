import reducerControllerSpecs from './TextareaSizeReducerController';

export function buildTextInput(labelText: string, inputId: string, name: string, dataController: string, dataTarget: string) {
    return `
<div class="d-flex ff-column-nowrap gs4 gsy">
    <div class="flex--item">
        <label class="d-block s-label" for="${inputId}">${labelText}</label>
    </div>
    <div class="d-flex ps-relative">
        <input type="text" id="${inputId}" class="s-input" name="${name}" data-${dataController}-target="${dataTarget}">
    </div>
</div>`;
}

export function buildCheckbox(labelText: string, inputId: string, dataController: string, dataTarget: string) {
    return `
<div class="s-check-control">
    <input class="s-checkbox" type="checkbox" id="${inputId}" data-${dataController}-target="${dataTarget}"/>
    <label class="s-label" for="${inputId}">${labelText}</label>
</div>`;
}

export function buildToggle(labelText: string, inputId: string, dataController: string, dataTarget: string, extraInputAttrs?: string) {
    return `
<div class="d-flex ai-center g8 jc-space-between">
    <label class="s-label" for="${inputId}">${labelText}</label>
    <input class="s-toggle-switch" 
           id="${inputId}"
           data-${dataController}-target="${dataTarget}"
            ${extraInputAttrs ?? ''}
           type="checkbox">
</div>`;
}

export function buildTextarea(
    textareaId: string | number, textareaName: string, rows: string | number,
    dataController: string, dataTarget: string,
    labelText: string,
    vB: { min: number; max: number; },
    shouldAddReducer = true
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
               data-${dataController}-target="${dataTarget}"
               ${shouldAddReducer ?
        `data-${reducerControllerSpecs.CONTROLLER}-target="${reducerControllerSpecs.TARGET}"
         data-action="${reducerControllerSpecs.CONTROLLER}#${reducerControllerSpecs.ACTION}"` :
        ''}></textarea>
     <div data-se-char-counter-target="output"></div>
</div>`;
}