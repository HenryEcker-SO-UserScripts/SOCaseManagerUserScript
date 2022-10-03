# Case Manager UserScript

A UserScript to help organise and coordinate plagiarism investigations on Stack Overflow.

Requires GM_getValue, GM_setValue, and GM_deleteValue to store access_tokens. 

## Review Posts

On all posts (excepting those you authored) there is a control panel.

There are two options "Record Post Action" and "Post Timeline".


### Recording Post Actions

You can use "Record Post Action" to indicate you've performed an action on the post. This will let others know that this post has been already been handled in some way.

[![][1]][1]

You can remove your action at any point by pressing the clear button in the "Record Post Action" popup.

[![][4]][4]

### Viewing Post Timeline
If the post has already been actioned on (this is any action including "Looks OK"), the "Post Timeline" button will become enabled and have an indicator

[![][2]][2]

Clicking on the "Post Timeline" button will let you view the timeline of actions on the post and who performed the action.

[![][3]][3]


### Summary Profile Indicator
Any posts which have already been actioned on (including "Looks OK"), will also have an indicator on the user's answers tab /user?tab=answers

[![][5]][5]

---

## User Profile

You are able to open investigations into users by going to their profile.

At the top of all profiles (except your own) there is a "Case Manager" button

[![][6]][6]

### Profile Stats and Managing Cases
Clicking the button will take you to their summary stats page

[![][7]][7]

This will show the number of posts with each action, as well as allow you to open an investigation into the user.

For users that are currently being investigated, you can also close a case from here.


### Links to Specific Posts
Clicking on the Posts tab will give you a list of links to the posts associated with each action.

[![][8]][8]


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

On any page that the script runs (like [your profile page](https://stackoverflow.com/users/current)), you will be presented with a modal to authorise the app.

[![][11]][11]

Click "Authorise App" and approve access to your account. You will need at least 1 API quote remaining (of 10,000) for it to confirm your account information.

Eventually you will be directed to a page with your access token

[![][12]][12]

Copy the access_token into the modal, then click "Save":

[![][13]][13]


### Managing Existing Credentials
You can invalidate any specific credential or de-authenticate the application via the Case Manager Settings.

It is preferable to invalidate or de-authenticate via this interface because it will both remove any stored credentials in the system _and_ those on the SE API side.


On your profile there will be a "Case Manager Settings" button.
[![][14]][14]

Clicking on the tab will bring you to the UserScript Settings page. Here you can:
1. retrieve a new access token (for whatever reason)
2. invalidate any existing access tokens (invalidating the access token currently being used on this device will also remove it from GM storage)
3. de-authenticate the entire application, which will invalidate all access tokens, remove the app from your approved applications list, and remove all stored credentials in the database.

[![][15]][15]


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