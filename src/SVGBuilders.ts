export function buildAlertSvg(dim = 18, viewBox = 18) {
    return `<svg aria-hidden="true" class="svg-icon iconAlert" width="${dim}" height="${dim}" viewBox="0 0 ${viewBox} ${viewBox}"><path d="M7.95 2.71c.58-.94 1.52-.94 2.1 0l7.69 12.58c.58.94.15 1.71-.96 1.71H1.22C.1 17-.32 16.23.26 15.29L7.95 2.71ZM8 6v5h2V6H8Zm0 7v2h2v-2H8Z"></path></svg>`;
}

export function buildCaseSvg(dim = 18, viewBox = 18) {
    return `<svg aria-hidden="true" class="svg-icon iconBriefcase" width="${dim}" height="${dim}" viewBox="0 0 ${viewBox} ${viewBox}"><path d="M5 4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7c0-1.1.9-2 2-2h1V4Zm7 0H6v1h6V4Z"></path></svg>`;
}

export function buildCheckmarkSvg(dim = 18, viewBox = 18) {
    return `<svg aria-hidden="true" class="svg-icon iconCheckmark" width="${dim}" height="${dim}" viewBox="0 0 ${viewBox} ${viewBox}"><path d="M16 4.41 14.59 3 6 11.59 2.41 8 1 9.41l5 5 10-10Z"></path></svg>`;
}

export function buildEditPenSvg(dim = 18, viewBox = 18) {
    return `<svg aria-hidden="true" class="svg-icon iconPencil" width="${dim}" height="${dim}" viewBox="0 0 ${viewBox} ${viewBox}"><path d="m13.68 2.15 2.17 2.17c.2.2.2.51 0 .71L14.5 6.39l-2.88-2.88 1.35-1.36c.2-.2.51-.2.71 0ZM2 13.13l8.5-8.5 2.88 2.88-8.5 8.5H2v-2.88Z"></path></svg>`;
}

export function buildSearchSvg(dim=18, viewBox=18){
    return `<svg aria-hidden="true" class="s-input-icon s-input-icon__search svg-icon iconSearch" width="${dim}" height="${dim}" viewBox="0 0 ${viewBox} ${viewBox}"><path d="m18 16.5-5.14-5.18h-.35a7 7 0 1 0-1.19 1.19v.35L16.5 18l1.5-1.5ZM12 7A5 5 0 1 1 2 7a5 5 0 0 1 10 0Z"></path></svg>`;
}

