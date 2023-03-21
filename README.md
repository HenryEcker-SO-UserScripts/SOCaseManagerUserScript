# Case Manager UserScript

A UserScript to help organise and coordinate plagiarism investigations on Stack Overflow.

Requires `GM_getValue`, `GM_setValue`, and `GM_deleteValue` to store access_tokens.

## Review Posts

On all posts (excepting those you authored) there is a control panel.

There are two options "Record Post Action" and "Post Timeline".

### Recording Post Actions

You can use "Record Post Action" to indicate you've performed an action on the post. This will let others know that this
post has been already been handled in some way.

#### How to know which action to select

| Feedback    | Reason                                                                                                                                                                                      |
|-------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Looks OK    | Indicates that the post is likely not plagiarised.                                                                                                                                          |
| Edited      | Indicates the post was edited to include appropriate attribution rather than being removed.                                                                                                 |
| Plagiarised | Indicates the post is plagiarised and that it has been flagged for removal.                                                                                                                 |
| Deleted     | Indicates the post was deleted.                                                                                                                                                             |
| Suspicious  | "Looks OK" but it... doesn't. Indicates the post is likely plagiarised even though a source could not be found or the discovered source is not definitive enough to merit flagging/removal. |

[![][1]][1]

You can remove your action at any point by pressing the clear button in the "Record Post Action" popup.

[![][4]][4]

### Viewing Post Timeline

If the post has already been actioned on (this is any action including "Looks OK"), the "Post Timeline" button will
become enabled and have an indicator

[![][2]][2]

Clicking on the "Post Timeline" button will let you view the timeline of actions on the post and who performed the
action.

[![][3]][3]

### Summary Profile Indicator

Any posts which have any feedback logged in the system, will also have an indicator on the user's answers
tab /user?tab=answers. 

There can be up to 4 different indicators on a post indicating actions taken.

1. A checkmark indicates the post received feedback "Look OK"
2. A pencil indicates the post has been edited to add attribution ("Edit" feedback)
3. A red suitcase indicates the post is plagiarised and has been flagged ("Plagiarised" feedback)
4. A yellow triangle alert indicates the post is suspicious ("Suspicious" feedback)

Here is what a post with all 4 indicators would look like:

[![][5]][5]

---

## User Profile

You are able to open investigations into users by going to their profile.

At the top of all profiles (except your own) there is a "Case Manager" button

[![][6]][6]

The button will gain an alert indicator if the user has ever had a post recorded in the system (for any reason).

[![][16]][16]

### Profile Stats and Managing Cases

Clicking the button will take you to their summary stats page

[![][7]][7]

This will show the number of posts with each action, as well as allow you to open an investigation into the user.

For users that are currently being investigated, you can also close a case from here.

### Links to Specific Posts

#### Table Info

Clicking on the Posts tab will give you a table posts recorded in the system. The first column is a link to the post.
The remaining columns represent the available actions. A checkmark indicates which action has been taken.

**Note**: Every row will have at least one checkmark as only posts which have an action on them will be logged in this
table.

[![][8]][8]

#### Filtering Posts

Changing the selection box at the top of each column will affect which rows are displayed.

For each column there are three options:

- **Any** (Any value is in the specified column is acceptable. Basically does not affect if the row is displayed or
  not.)
- **Checked** (The value in the specified column _must_ be a checkmark.)
- **Unchecked** (The value in the specified column _must_ be empty (without a checkmark).)

[![][17]][17]

Multiple action filters can be selected to limit the display to only posts with a specific combination of actions (
_e.g._ Flagged but not Deleted).

[![][18]][18]

At any time the "Clear Filters" button in the first column can be used to clear all filters (reset all columns to "
Any").


---

## All Users

At any point you can go to the /users tab and click on the "Plagiarist" page:

[![][9]][9]

This will allow you to search for users who have open cases, closed cases, or all users.

You can use the search bar to filter users by username.

[![][10]][10]


---

## Personal Credentials

### Initially Obtaining Credentials

When first opening the application you will be asked to go through and authorize yourself via the Stack Exchange API.

On any page that the script runs (like [your profile page](https://stackoverflow.com/users/current)), you will be
presented with a modal to authorise the app.

[![][11]][11]

Click "Authorise App" and approve access to your account. You will need at least 1 API quote remaining (of 10,000) for
it to confirm your account information.

Eventually you will be directed to a page with your access token

[![][12]][12]

Copy the access_token into the modal, then click "Save":

[![][13]][13]

### Managing Existing Credentials

#### General Credential Information

You can invalidate any specific credential or de-authenticate the application via the Case Manager Settings.

It is preferable to invalidate or de-authenticate via this interface because it will both remove any stored credentials
in the system _and_ those on the SE API side.

The SE access token is always valid (unless it is invalidated) and can be used to obtain new access credentials. The
access credentials (jwt) will expire after a period of time, but a new token will be automatically be requested when
making any Case Manager API request after expiry.

If you invalidate your credentials for a different device, you will need to manually clear out the credentials from your
UserScript manager storage as you will start returning 403s for all requests, however, you will not be prompted to
re-authenticate because the script will see _a_ token is available.

Your token is __not__ cleared when receiving a 403 (except for 403s in response to requesting a new token) because a 403
response does not always indicate the token has been invalidated. Sometimes it can be returned for accidental requests
to something you do not have access to (like active case status for your own account).

#### Management Console

On your profile there will be a "Case Manager Settings" button.
[![][14]][14]

Clicking on the tab will bring you to the [UserScript Settings page][settings page]. Here you can:

1. retrieve a new access token (for whatever reason)
2. invalidate any existing access tokens (invalidating the access token currently being used on this device will also
   remove it from GM storage)
3. de-authenticate the entire application, which will invalidate all access tokens, remove the app from your approved
   applications list, and remove all stored credentials in the database.

[![][15]][15]

## Moderator Tools

### Nuke Post
#### Post-specific options

Moderators gain access to an additional button on each post, which allows the post to easily be removed and feedback provided to the Case Manager.

[![][19]][19]

There are three options available and up to 4 actions will be taken. The post **will always be deleted** even if all options are unchecked.

When the Nuke button is pressed:
1. The character count is validated depending on which options are selected. Comments and Flags have different length requirements, both limits are validated based on the selected options.
2. If the Flag option is selected, the post is flagged using the text in the textarea. If the flag operation fails no further actions are taken (an error is displayed).
3. A "delete" vote is added to the post. If the delete operation fails, no further action is taken.
4. If the Comment option is selected, a comment is added to the post.
5. If the Log option is selected, feedback is logged in the Case Manager. The post is marked as "Plagiarised" and "Deleted".


#### Detail Text manager

Moderators also have an additional option in their [settings page] to specify what the default form values for nuking posts.

| Field       | Default      | Description                                                                                                                                                                           |
|-------------|--------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Detail Text | Empty String | Populates the textarea with a string to easily flag and comment on posts                                                                                                              |
| Flag        | Unchecked    | Flag post by default. This is false by default because many instances of plagiarism are brought to moderator attention via custom flag, and would not normally require a second flag. |
| Comment     | Unchecked    | Leave a comment on the post by default. This is false by default since "Delete as plagiarism" now causes the UI to show the reason for deletion.                                      |
| Log         | Checked      | Log feedback with Case Manager. This is true by default to help to record patterns of behaviour.                                                                                      |


[![][20]][20]


[settings page]: https://stackoverflow.com/users/current?tab=case-manager-settings

[1]: ./readme-images/PostSummary/post-action-panel.png

[2]: ./readme-images/PostSummary/timeline-event-indicator.png

[3]: ./readme-images/PostSummary/timeline-view.png

[4]: ./readme-images/PostSummary/clear-post-action-button.png

[5]: ./readme-images/PostSummary/answer-page-indicator.png

[6]: ./readme-images/UserSummary/user-case-manager-button.png

[7]: ./readme-images/UserSummary/user-summary-stats.png

[8]: ./readme-images/UserSummary/user-detail-stats.png

[9]: ./readme-images/Search/users-plagiarist-tab.png

[10]: ./readme-images/Search/plagiarist-page.png

[11]: ./readme-images/Settings/auth%20modal.png

[12]: ./readme-images/Settings/auth%20token.png

[13]: ./readme-images/Settings/auth%20modal%20entry.png

[14]: ./readme-images/Settings/User%20Profile%20Settings%20button.png

[15]: ./readme-images/Settings/Case%20Manager%20Auth%20Settings.png

[16]: ./readme-images/UserSummary/user-case-manager-button-with-alert.png

[17]: ./readme-images/UserSummary/user-detail-stats-filtered.png

[18]: ./readme-images/UserSummary/user-detail-stats-filtered-multiple.png

[19]: ./readme-images/ModOnly/nuke-plagiarism-console.png
[20]: ./readme-images/ModOnly/edit-nuke-post-default-settings.png