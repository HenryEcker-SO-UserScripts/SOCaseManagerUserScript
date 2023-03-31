import {fetchFromAWS} from '../../../API/AWSAPI';
import {roleIdToken} from '../../../API/gmAPI';


export function buildAuthRoleDetails(): JQuery {
    return $('<div></div>')
        .append('<h3 class="fs-title mb12">Your Privilege Info</h3>')
        .append(buildRoleDetails());
}

function buildRoleDetails() {

    // Start with loading indicator
    const roleDetails = $('<div><div class="is-loading">Loading...</div></div>');

    // Make fetch request for credentials
    void fetchFromAWS('/auth/credentials/my-role/details')
        .then(res => res.json())
        .then(({role_id, role_description}: { role_id: number; role_description: string; }) => {
            roleDetails.empty(); // Clear out loading indicator
            // Update Token while here
            GM_setValue(roleIdToken, role_id);
            // Display Role details
            roleDetails.append(`<div><span>You are currently have <span class="td-underline">${role_description}</span> level privileges.</span></div>`);
        });
    return roleDetails;
}
