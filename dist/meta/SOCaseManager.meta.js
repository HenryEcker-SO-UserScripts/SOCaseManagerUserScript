// ==UserScript==
// @name        SO Plagiarism Case Manager
// @description Help facilitate and track collaborative plagiarism cleanup efforts
// @homepage    https://github.com/HenryEcker-SO-UserScripts/SOCaseManagerUserScript
// @author      Henry Ecker (https://github.com/HenryEcker)
// @version     0.5.14
// @downloadURL https://github.com/HenryEcker-SO-UserScripts/SOCaseManagerUserScript/raw/master/dist/SOCaseManager.user.js
// @updateURL   https://github.com/HenryEcker-SO-UserScripts/SOCaseManagerUserScript/raw/master/dist/meta/SOCaseManager.meta.js
// @match       *://stackoverflow.com/questions/*
// @match       *://stackoverflow.com/users
// @match       *://stackoverflow.com/users?*
// @match       *://stackoverflow.com/users/*
// @exclude     *://stackoverflow.com/questions/ask*
// @exclude     *://stackoverflow.com/users/apps/*
// @exclude     *://stackoverflow.com/users/delete/*
// @exclude     *://stackoverflow.com/users/edit/*
// @exclude     *://stackoverflow.com/users/email/*
// @exclude     *://stackoverflow.com/users/hidecommunities/*
// @exclude     *://stackoverflow.com/users/message/*
// @exclude     *://stackoverflow.com/users/my-collectives/*
// @exclude     *://stackoverflow.com/users/mylogins/*
// @exclude     *://stackoverflow.com/users/preferences/*
// @exclude     *://stackoverflow.com/users/saves/*
// @exclude     *://stackoverflow.com/users/tag-notifications/*
// @exclude     *://stackoverflow.com/users/teams/*
// @grant       GM_deleteValue
// @grant       GM_getValue
// @grant       GM_setValue
// ==/UserScript==
/* globals $, StackExchange */
