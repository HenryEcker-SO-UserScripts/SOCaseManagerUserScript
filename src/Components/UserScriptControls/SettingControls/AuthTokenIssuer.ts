import {seTokenAuthRoute} from '../../../AWSAPI';

export function buildTokenIssuer(): JQuery {
    return $('<div></div>')
        .append('<h3 class="fs-title mb12">Issue new token</h3>')
        .append('<p>You can issue a new auth token for use on another device or to manually replace an existing token. Please invalidate any existing tokens, so they can no longer be used to access your information.</p>')
        .append(`<a class="s-link s-link__underlined" href="${seTokenAuthRoute}" target="_blank" rel="noopener noreferrer">Issue new auth token</a>`);
}