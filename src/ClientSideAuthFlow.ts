import {seApiTokenGmStorageKey, seTokenAuthRoute} from './Globals';
import {requestNewJwt} from './AWSAPI';


export const startAuthFlow = () => {
    const authModalId = 'case-manager-client-auth-modal';

    const modal = $(`<aside class="s-modal" id="${authModalId}" role="dialog" aria-labelledby="${authModalId}-modal-title" aria-describedby="${authModalId}-modal-description" aria-hidden="false" data-controller="s-modal" data-s-modal-target="modal"></aside>`);
    const modalBody = $(`<div class="s-modal--dialog" role="document">
    <h1 class="s-modal--header" id="${authModalId}-modal-title">Authorise Case Manager</h1>
    <p class="s-modal--body" id="${authModalId}-modal-description">The Case Manager requires API access validate your user account.</p>
    <ol>
        <li>
            <a class="s-link s-link__underlined" href="${seTokenAuthRoute}" target="_blank" rel="noopener noreferrer">Authorise App</a>
        </li>
        <li><label for="${authModalId}-input" class="mr6">Access Token:</label><input style="width:225px" id="${authModalId}-input"/></li>
    </ol>
    <div class="d-flex gs8 gsx s-modal--footer">
        <button class="flex--item s-btn s-btn__primary" type="button" id="${authModalId}-save">Save</button>
        <button class="flex--item s-btn" type="button" data-action="s-modal#hide">Cancel</button>
    </div>
    <button class="s-modal--close s-btn s-btn__muted" aria-label="Close" data-action="s-modal#hide">
        <svg aria-hidden="true" class="svg-icon iconClearSm" width="14" height="14" viewBox="0 0 14 14">
            <path d="M12 3.41 10.59 2 7 5.59 3.41 2 2 3.41 5.59 7 2 10.59 3.41 12 7 8.41 10.59 12 12 10.59 8.41 7 12 3.41Z"></path>
        </svg>
    </button>
</div>`);

    modalBody.find(`#${authModalId}-save`).on('click', (ev) => {
        ev.preventDefault();
        const inputValue = $(`#${authModalId}-input`).val() as string | undefined;
        if (inputValue !== undefined && inputValue.length > 0) {
            GM_setValue(seApiTokenGmStorageKey, inputValue);
            void requestNewJwt().then(() => {
                window.location.reload(); // refresh page to enable
            });
        }
    });
    modal.append(modalBody);
    $('body').append(modal);
};