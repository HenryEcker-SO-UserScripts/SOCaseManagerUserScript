// ==UserScript==
// @name        SO Plagiarism Case Manager
// @description Help facilitate and track collaborative plagiarism cleanup efforts
// @homepage    https://github.com/HenryEcker/SOCaseManagerUserScript
// @author      Henry Ecker (https://github.com/HenryEcker)
// @version     0.0.8
// @downloadURL https://github.com/HenryEcker/SOCaseManagerUserScript/raw/master/dist/SOCaseManager.user.js
// @updateURL   https://github.com/HenryEcker/SOCaseManagerUserScript/raw/master/dist/SOCaseManager.user.js
// @match       *://stackoverflow.com/questions/*
// @match       *://stackoverflow.com/users/*
// @match       *://stackoverflow.com/users
// @exclude     *://stackoverflow.com/users/edit/*
// @exclude     *://stackoverflow.com/users/delete/*
// @exclude     *://stackoverflow.com/users/email/*
// @exclude     *://stackoverflow.com/users/tag-notifications/*
// @exclude     *://stackoverflow.com/users/preferences/*
// @exclude     *://stackoverflow.com/users/hidecommunities/*
// @exclude     *://stackoverflow.com/users/my-collectives/*
// @exclude     *://stackoverflow.com/users/teams/*
// @exclude     *://stackoverflow.com/users/mylogins/*
// @exclude     *://stackoverflow.com/users/apps/*
// @exclude     *://stackoverflow.com/users/flag-summary/*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// ==/UserScript==
/* globals $, StackExchange */

!function(){const e=(e=18,t=18)=>`<svg aria-hidden="true" class="svg-icon iconAlert" width="${e}" height="${e}" viewBox="0 0 ${t} ${t}"><path d="M7.95 2.71c.58-.94 1.52-.94 2.1 0l7.69 12.58c.58.94.15 1.71-.96 1.71H1.22C.1 17-.32 16.23.26 15.29L7.95 2.71ZM8 6v5h2V6H8Zm0 7v2h2v-2H8Z"></path></svg>`,t=(e=18,t=18)=>`<svg aria-hidden="true" class="svg-icon iconBriefcase" width="${e}" height="${e}" viewBox="0 0 ${t} ${t}"><path d="M5 4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7c0-1.1.9-2 2-2h1V4Zm7 0H6v1h6V4Z"></path></svg>`,a="access_token",s="se_api_token",n="?tab=case-manager",i="?tab=case-manager-settings",o="?tab=answers",r="?tab=case",d="https://stackoverflow.com/oauth?client_id=24380&scope=no_expiry&redirect_uri=https://4shuk8vsp8.execute-api.us-east-1.amazonaws.com/prod/auth/se/oauth",l=()=>c("/auth/cm/jwt",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({se_api_token:GM_getValue(s)})},!1).then((e=>e.json())).then((e=>{GM_setValue(a,e.cm_access_token)})).catch((e=>{GM_deleteValue(a),console.error(e)})),c=(e,t,s=!0)=>{let n=s?{headers:{access_token:GM_getValue(a)}}:{};return void 0!==t&&(n={...t,headers:{...t.headers,...n.headers}}),fetch(`https://4shuk8vsp8.execute-api.us-east-1.amazonaws.com/prod${e}`,n).then((a=>401===a.status?l().then((()=>c(e,t))):a))},p=e=>c(`/summary/posts/${e.join(";")}`).then((e=>e.json())).then((e=>Promise.resolve(new Set(e)))),h=e=>`case-manager-answer-popover-${e}`,u=(e,t)=>`checkbox-${e}-${t}`,g=(e,t,a,s)=>n=>{n.preventDefault(),StackExchange.helpers.showConfirmModal({title:"Remove your action",bodyHtml:`<span>Are you sure you want to remove your "${e.action_description}" action from this post?</span>`,buttonLabel:"Remove Action"}).then((n=>{n&&c(`/handle/post/${t}/${e.action_id}`,{method:"DELETE"}).then((e=>{200===e.status&&($(`#${a}`).prop("checked",!1).prop("disabled",!1),s.remove(),$(`#${b(t)}`).attr("timeline-loaded","false"))}))}))},m=(e,t,a)=>{const s=$('<div class="case-manager-post-action-container"><h3>Case Manager Post Action Panel</h3></div>'),n=$('<form class="d-grid grid__1 g6" style="grid-auto-rows: 1fr"></form>');for(const t of a){const a=$('<div class="grid--item d-flex fd-row jc-space-between ai-center"></div>'),s=u(e,t.action_id),i=$(`<div class="d-flex gs8"><div class="flex--item"><input class="s-checkbox" type="checkbox" name="${t.action_description}" data-action-id="${t.action_id}" id="${s}" ${t.user_acted?"checked disabled":""}/></div><label class="flex--item s-label fw-normal" for="${s}">${t.action_description}</label></div>`);if(a.append(i),t.user_acted){const n=$('<button class="s-btn s-btn__danger" type="button">Clear</button>');n.on("click",g(t,e,s,n)),a.append(n)}n.append(a)}n.append($('<div class="d-flex fd-row jc-start"><button class="s-btn s-btn__primary" type="submit">Save</button><button class="s-btn" type="reset">Reset</button></div>')),n.on("submit",((e,t,a)=>s=>{s.preventDefault();const n=e.find('button[type="submit"]');n.prop("disabled",!0);const i=e.find('input[type="checkbox"]:checked:not(:disabled)');if(0===i.length)return;const o={};-1!==a&&(o.postOwnerId=a),o.actionIds=i.map(((e,t)=>{const a=$(t).attr("data-action-id");return void 0===a?void 0:Number(a)})).toArray(),c(`/handle/post/${t}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(o)}).then((e=>e.json())).then((e=>{_(t),m(t,a,e)})).catch((()=>{n.prop("disabled",!1)}))})(n,e,t)),s.append(n),$(`#${h(e)} > .popover-mount-point`).empty().append(s)},v=(e,t,a)=>{const s=$(`<button title="Click to record an action you have taken on this post." class="s-btn s-btn__dropdown" role="button" aria-controls="${h(t)}" aria-expanded="false" data-controller="s-popover" data-action="s-popover#toggle" data-s-popover-placement="top-end" data-s-popover-toggle-class="is-selected">Record Post Action</button>`),n=$(`<div class="s-popover" id="${h(t)}" role="menu"><div class="s-popover--arrow"/><div class="popover-mount-point"><div class="is-loading">Loading…</div></div></div>`);s.on("click",(e=>{e.preventDefault(),"true"!==s.attr("options-loaded")&&c(`/handle/post/${t}`).then((e=>e.json())).then((e=>{m(t,a,e),s.attr("options-loaded","true")}))})),e.append(s),e.append(n)},b=e=>`${e}-timeline-indicator-button`,f=e=>`case-manager-timeline-popover-${e}`,w=(e,t)=>{const a=$(`<button id="${b(t)}" class="flex--item s-btn s-btn__danger ws-nowrap" type="button" disabled>Post Timeline</button>`),s=$(`<div class="s-popover" id="${f(t)}" role="menu"><div class="s-popover--arrow"/><div class="popover-mount-point"><div class="is-loading">Loading…</div></div></div>`);e.append(a),e.append(s)},_=t=>{const a=b(t);$(`#${a}`).replaceWith(((t,a)=>{const s=f(a),n=$(`<button title="Click to view a record of actions taken on this post." id="${t}" class="flex--item s-btn s-btn__danger s-btn__icon ws-nowrap s-btn__dropdown" role="button" aria-controls="${s}" aria-expanded="false" data-controller="s-popover" data-action="s-popover#toggle" data-s-popover-placement="top-start" data-s-popover-toggle-class="is-selected">${e()}<span class="px8">Post Timeline</span></button>`);return n.on("click",(e=>{e.preventDefault(),"true"!==n.attr("timeline-loaded")&&c(`/timeline/post/${a}`).then((e=>e.json())).then((e=>{const t=$('<div class="case-manager-post-timeline-container"></div>');t.append($("<h3>Case Manager Post Timeline</h3>"));const a=$('<div class="d-flex fd-column gs4"></div>');for(const t of e)a.append($(`<div class="flex--item d-flex fd-row jc-space-between ai-center"><a href="/users/${t.account_id}">${t.display_name}</a><span data-event-type-id="${t.timeline_event_type}">${t.timeline_event_description}</span><span>${new Date(t.event_creation_date).toLocaleString()}</span></div>`));t.append(a),$(`#${s} > .popover-mount-point`).empty().append(t),n.attr("timeline-loaded","true")}))})),n})(a,t))},y=async()=>{const e=$("div.answer"),t=e.map(((e,t)=>Number($(t).attr("data-answerid")))).toArray(),a=e.find('div[itemprop="author"]').map(((e,t)=>{const a=$(t).find("a");if(0===a.length)return-1;const s=a.attr("href");if(void 0===s)return-1;const n=s.match(/\/users\/(\d+)\/.*/);return null===n?-1:Number(n[1])}));if(e.length>0){for(let s=0;s<e.length;s++){const n=$(e[s]),i=t[s],o=a[s];if(void 0===i||o===StackExchange.options.user.userId)continue;const r=$('<div class="p8 d-flex fd-row jc-space-between ai-center"></div>');w(r,i),v(r,i,o),n.append(r)}(e=>{p(e).then((e=>{for(const t of e)_(t)})).catch((e=>{console.error(e)}))})(t)}},P=(e,t)=>new Set([...e,...t]);class x{constructor(){this.checkedPostIds=new Set,this.annotatedPosts=new Set}updateSets(){const e=new Set($(".s-post-summary").map(((e,t)=>Number(t.getAttribute("data-post-id")))).toArray()),t=[...(a=e,s=this.checkedPostIds,new Set([...a].filter((e=>!s.has(e)))))];var a,s;0!==t.length?p(t).then((t=>{this.annotatedPosts=P(this.annotatedPosts,t),this.checkedPostIds=P(this.checkedPostIds,e),this.render(e)})):this.render(e)}render(e){for(const a of((e,t)=>new Set([...e].filter((e=>t.has(e)))))(e,this.annotatedPosts))$(`#answer-id-${a} .s-post-summary--stats-item:eq(0)`).before($(`<div title="This post is noted in the Case Manager System" class="s-post-summary--stats-item" style="color: var(--red-600)">${t()}</div>`))}}const k=(e,t)=>{const a=$('<div class="grid--item"></div>'),n=t?{containerText:"This user is <strong>currently under investigation</strong>.",buttonText:"Close current investigation",apiRoute:"close",buttonClasses:"s-btn__primary",modalOptions:{title:"Close Current Investigation",body:"Are you sure you want to close out the current investigation of this user? This will remove the user from the active cases list. Please only do this if the majority of posts have either been actioned on or if the user is not a serial plagiarist.",buttonLabel:"Yes, I'm sure"}}:{containerText:"This user is <u>not</u> currently under investigation.",buttonText:"Open an investigation",apiRoute:"open",buttonClasses:"s-btn__danger s-btn__filled",modalOptions:{title:"Open An Investigation",body:"Are you sure you want to open an investigation into this user? This will add this user to a list of users under investigation. Please only do this if you suspect the user of serial plagiarism.",buttonLabel:"Yes, I'm sure"}};a.append($('<h3 class="fs-title mb8">Case Management Console</h3>')),a.append($(`<p>${n.containerText}</p>`));const i=$(`<button class="ml16 s-btn ${n.buttonClasses}">${n.buttonText}</button>`);return i.on("click",(i=>{i.preventDefault(),StackExchange.helpers.showConfirmModal(n.modalOptions).then((i=>{i&&(t?c(`/case/${n.apiRoute}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:e})}):((e,t)=>{const a=new URLSearchParams(t);return a.set("site","stackoverflow"),a.set("key","BkvRpNB*IzKMdjAcikc4jA(("),a.set("access_token",GM_getValue(s)),fetch(`https://api.stackexchange.com/2.3${e}?${a.toString()}`)})(`/users/${e}`,"filter=!LnNkvqQOuAK0z-T)oydzPI").then((e=>e.json())).then((e=>{if(0===e.items.length)throw Error("User not found!");const t=e.items[0];return c(`/case/${n.apiRoute}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:t.user_id,displayName:t.display_name,profileImage:t.profile_image})})}))).then((t=>{if(200===t.status)return t.json().then((t=>a.replaceWith(k(e,t.hasOpenCase))));if(409===t.status)return t.json().then((t=>(StackExchange.helpers.showToast(t.message,{transientTimeout:1e4,type:"warning"}),a.replaceWith(k(e,t.hasOpenCase)))));throw Error("Something went wrong")}))}))})),a.append(i),a};class S{constructor(e){this.userId=e,this.container=$('<div class="d-flex mb48"></div>'),this.currentPage="summary",this.pageLoadMap={summary:{isLoaded:!1},posts:{isLoaded:!1}}}setCurrentPage(){const e=new URLSearchParams(window.location.search);e.has("page")&&"summary"!==e.get("page")?"posts"===e.get("page")&&(this.currentPage="posts"):this.currentPage="summary"}init(){return this.setCurrentPage(),window.addEventListener("popstate",(()=>{this.setCurrentPage(),this.render()})),this.render(),this.container}buildNavLi(e,t,a){const s=$("<li></li>"),n=this.currentPage===a,i=$(`<a class="s-navigation--item pr48 ps-relative${n?" is-selected":""}" href="${t}">${e}</a>`);return i.on("click",(e=>{e.preventDefault(),this.currentPage=a,n||(window.history.pushState({cmcPageName:a},"",t),this.render())})),s.append(i),s}buildNav(){const e=$('<nav class="flex--item fl-shrink0 mr32" role="navigation"></nav>'),t=$('<ul class="s-navigation s-navigation__muted s-navigation__vertical"></ul>'),a=window.location.pathname,s=new URLSearchParams(window.location.search);return s.set("page","summary"),t.append(this.buildNavLi("Summary",`${a}?${s.toString()}`,"summary")),s.set("page","posts"),t.append(this.buildNavLi("Posts",`${a}?${s.toString()}`,"posts")),e.append(t),e}async getSummaryPageData(){if(this.pageLoadMap.summary.isLoaded&&this.pageLoadMap.summary.pageData)return this.pageLoadMap.summary.pageData;{const e=await c(`/case/summary/${this.userId}`).then((e=>e.json()));return this.pageLoadMap.summary={isLoaded:!0,pageData:e},e}}async buildCaseSummaryPage(){const e=$('<section class="flex--item fl-grow1 wmx100"><div class="s-page-title mb24"><h1 class="s-page-title--header m0 baw0 p0">Summary</h1></section>'),t=await this.getSummaryPageData(),a=$('<div class="d-grid grid__2 md:grid__1 g8"></div>');a.append(k(this.userId,t.hasOpenCase)),a.append((e=>{const t=$('<div class="grid--item p4 s-table-container"></div>'),a=$('<table class="s-table"><thead><tr><th scope="col">Post Action</th><th scope="col">Number of Posts</th></tr></thead></table>'),s=$("<tbody></tbody>");return e.forEach((e=>{s.append($(`<tr><td>${e.action_taken}</td><td>${e.number_of_posts}</td></tr>`))})),a.append(s),t.append(a),t})(t.postSummary)),t.caseTimeline.length>0&&a.append((e=>{const t=$('<div class="grid--item p8"><h3 class="fs-title mb8">Investigation History</h3></div>'),a=$('<div class="d-flex fd-column gs4"></div>');return e.forEach((e=>{a.append($(`<div class="flex--item d-flex fd-row jc-space-between ai-center" data-timeline-id="${e.case_event_id}"><a href="/users/${e.account_id}">${e.display_name}</a><span data-event-type-id="${e.case_event_type_id}">${e.case_event_description}</span><span>${new Date(e.event_creation_date).toLocaleString()}</span></div>`))})),t.append(a),t})(t.caseTimeline)),e.append(a),this.container.append(e)}async getBreakdownData(){if(this.pageLoadMap.posts.isLoaded&&this.pageLoadMap.posts.pageData)return this.pageLoadMap.posts.pageData;{const e=await c(`/case/posts/${this.userId}`).then((e=>e.json()));return this.pageLoadMap.posts={isLoaded:!0,pageData:e},e}}async buildPostsBreakdownPage(){const e=$('<section class="flex--item fl-grow1 wmx100"><div class="s-page-title mb24"><h1 class="s-page-title--header m0 baw0 p0">Posts</h1></section>'),t=await this.getBreakdownData(),a=$('<div class="d-grid grid__2 md:grid__1 g8"></div>');t.forEach((e=>{const t=$(`<div class="grid--item p8" data-event-id="${e.id}"><h3 class="fs-title mb12">${e.timeline_event_description}</h3></div>`),s=$('<div class="d-flex fd-row fw-wrap gs16 hmn1 hmx4 overflow-y-scroll"></div>');e.post_ids.forEach((e=>{s.append($(`<a class="flex--item" href="/a/${e}" target="_blank" rel="noreferrer noopener">${e}</a>`))})),t.append(s),a.append(t)})),e.append(a),this.container.append(e)}render(){this.container.empty(),this.container.append(this.buildNav()),"summary"===this.currentPage?this.buildCaseSummaryPage():"posts"===this.currentPage&&this.buildPostsBreakdownPage()}}class C{constructor(){this.needsTotalPages=!0,this.needsGroupInfo=!0,this.currentPage=1,this.totalPages=1,this.group="1",this.userData=[],this.search="",this.groupInfo=[]}setCurrentPage(){const e=new URLSearchParams(window.location.search);e.has("page")&&(this.currentPage=Number(e.get("page"))),e.has("group")&&(this.group=e.get("group")),e.has("search")&&(this.search=e.get("search"))}buildPublicSearchQuery(){return`/users?tab=case&group=${this.group}&page=${this.currentPage}${this.search.length>0?`&search=${this.search}`:""}`}pullDownData(){return c(`/cases?group=${this.group}&page=${this.currentPage}${this.search.length>0?`&search=${this.search}`:""}${this.needsTotalPages?"&total-pages=true":""}${this.needsGroupInfo?"&group-info=true":""}`).then((e=>e.json())).then((e=>{this.totalPages=e.totalPages||this.totalPages,this.groupInfo=e.groupInfo||this.groupInfo,this.userData=e.cases}))}pullDownAndRender(){return this.pullDownData().then((()=>{this.render()}))}init(){this.setCurrentPage();const e=$("#mainbar-full").empty();e.append($('<h1 class="fs-headline1 mb24">Plagiarists</h1>'));const t=$('<div class="d-flex fw-wrap ai-stretch md:d-block"></div>'),a=$('<input id="userfilter" name="userfilter" class="s-input s-input__search h100 wmx3" autocomplete="off" type="text" placeholder="Filter by user">');this.search.length>0&&a.val(this.search),a.on("input",(e=>{clearTimeout(this.searchTimeout),this.search!==e.target.value&&(this.search=e.target.value,this.searchTimeout=setTimeout((()=>{this.currentPage=1,this.needsTotalPages=!0,window.history.pushState("search_paging","",this.buildPublicSearchQuery()),this.pullDownAndRender()}),450))})),t.append($('<div class="flex--item mb12 ps-relative"></div>').append(a).append($('<svg aria-hidden="true" class="s-input-icon s-input-icon__search svg-icon iconSearch" width="18" height="18" viewBox="0 0 18 18"><path d="m18 16.5-5.14-5.18h-.35a7 7 0 1 0-1.19 1.19v.35L16.5 18l1.5-1.5ZM12 7A5 5 0 1 1 2 7a5 5 0 0 1 10 0Z"></path></svg>'))),t.append($('<div class="flex--item ml-auto mb12 h100 d-flex s-btn-group js-filter-btn"><a class="js-sort-preference-change flex--item s-btn s-btn__muted s-btn__outlined" href="/users?tab=reputation" data-nav-xhref="" title="Users with the highest reputation scores" data-value="reputation" data-shortcut="" aria-current="page"> Reputation</a><a class="js-sort-preference-change flex--item s-btn s-btn__muted s-btn__outlined" href="/users?tab=newusers" data-nav-xhref="" title="Users who joined in the last 30 days" data-value="newusers" data-shortcut=""> New users</a><a class="js-sort-preference-change flex--item s-btn s-btn__muted s-btn__outlined" href="/users?tab=voters" data-nav-xhref="" title="Users who voted more than 10 times" data-value="voters" data-shortcut=""> Voters</a><a class="js-sort-preference-change flex--item s-btn s-btn__muted s-btn__outlined" href="/users?tab=editors" data-nav-xhref="" title="Users who edited at least 5 posts" data-value="editors" data-shortcut=""> Editors</a><a class="js-sort-preference-change flex--item s-btn s-btn__muted s-btn__outlined" href="/users?tab=moderators" data-nav-xhref="" title="Our current community moderators" data-value="moderators" data-shortcut=""> Moderators</a><a class="js-sort-preference-change youarehere is-selected flex--item s-btn s-btn__muted s-btn__outlined" href="/users?tab=case" data-nav-xhref="" title="Users who have been or are currently under investigation" data-value="plagiarist" data-shortcut="">Plagiarists</a></div>')),e.append(t),e.append($('<div class="fs-body2 mt8 mb12"><div class="d-flex jc-space-between"><div class="flex--item ml-auto md:ml0"><div id="tabs-interval" class="subtabs d-flex"></div></div></div></div>')),e.append($('<div id="user-browser" class="d-grid grid__4 lg:grid__3 md:grid__2 sm:grid__1 g12"></div>')),e.append($('<div id="user-pagination" class="s-pagination site1 themed pager float-right"></div>')),this.pullDownData().then((()=>{this.needsTotalPages=!1,this.needsGroupInfo=!1,this.render()})),window.addEventListener("popstate",(()=>{this.setCurrentPage(),this.pullDownAndRender()}))}buildGroupToggleLink(e,t){const a=`/users?tab=case&group=${e}${this.search.length>0?`&search=${this.search}`:""}`,s=$(`<a${e===this.group?' class="youarehere is-selected"':""} href="${a}" data-nav-xhref="" data-value="${e}" data-shortcut="">${t}</a>`);return s.on("click",(t=>{t.preventDefault(),this.group!==e&&(window.history.pushState("group_paging","",a),this.group=e,this.currentPage=1,this.needsTotalPages=!0,this.pullDownAndRender())})),s}buildGroupToggle(){const e=$("#tabs-interval").empty();this.groupInfo.forEach((t=>{e.append(this.buildGroupToggleLink(t.group_id,t.description))}))}buildUserPanel(){const e=$("#user-browser").empty();this.userData.forEach((t=>{e.append(((e,t,a,s,n)=>{const i=`/users/${e}?tab=case-manager`;return $(`<div class="grid--item user-info"> ${null!==t?`<div class="user-gravatar48"><a href="${i}"><div class="gravatar-wrapper-48"><img src="${t}" alt="${a}'s user avatar" width="48" height="48" class="bar-sm"></div></a></div>`:""} <div class="user-details"><a href="${i}">${a}</a><div class="d-flex fd-column mt6"><span>Case ${s} on</span><span>${new Date(n).toLocaleString()}</span></div></div></div>`)})(t.investigated_user_id,t.profile_image,t.display_name,t.current_state,t.event_creation_date))}))}buildHrefForNavItem(e){return`/users?tab=case&group=${this.group}&page=${e}${this.search.length>0?`&search=${this.search}`:""}`}buildNavItem(e,t){void 0===t&&(t=e);const a=this.buildHrefForNavItem(e),s=$(`<a class="s-pagination--item" href="${a}">${t}</a>`);return s.on("click",(t=>{t.preventDefault(),window.history.pushState("paging","",a),this.currentPage=e,this.pullDownAndRender()})),s}buildPagination(){const e=$("#user-pagination").empty();if(1===this.totalPages)return;const t=t=>{const a=t+1;a===this.currentPage?e.append(`<span class="s-pagination--item is-selected" aria-current="page">${a}</span>`):e.append(this.buildNavItem(a))};1!==this.currentPage&&e.append(this.buildNavItem(this.currentPage-1,"Prev"));this.totalPages<=7?[...Array(this.totalPages).keys()].forEach(t):(this.currentPage-5>=0&&(e.append(this.buildNavItem(1)),e.append('<span class="s-pagination--item s-pagination--item__clear">…</span>')),this.currentPage<5?[...Array(5).keys()].forEach(t):this.currentPage>this.totalPages-5?[...Array(5).keys()].forEach((e=>{t(this.totalPages-5+e)})):[...Array(5).keys()].forEach((e=>{t(this.currentPage-Math.ceil(2.5)+e)})),this.totalPages-this.currentPage>=5&&(e.append('<span class="s-pagination--item s-pagination--item__clear">…</span>'),e.append(this.buildNavItem(this.totalPages)))),this.currentPage!==this.totalPages&&e.append(this.buildNavItem(this.currentPage+1,"Next"))}render(){this.buildGroupToggle(),this.buildUserPanel(),this.buildPagination()}}const T=()=>{if(null===GM_getValue(a,null))return void(()=>{const e="case-manager-client-auth-modal",t=$(`<aside class="s-modal" id="${e}" role="dialog" aria-labelledby="${e}-modal-title" aria-describedby="${e}-modal-description" aria-hidden="false" data-controller="s-modal" data-s-modal-target="modal"></aside>`),a=$(`<div class="s-modal--dialog" role="document"><h1 class="s-modal--header" id="${e}-modal-title">Authorise Case Manager</h1><p class="s-modal--body" id="${e}-modal-description">The Case Manager requires API access validate your user account.</p><ol><li><a class="s-link s-link__underlined" href="${d}" target="_blank" rel="noopener noreferrer">Authorise App</a></li><li><label for="${e}-input" class="mr6">Access Token:</label><input style="width:225px" id="${e}-input"/></li></ol><div class="d-flex gs8 gsx s-modal--footer"><button class="flex--item s-btn s-btn__primary" type="button" id="${e}-save">Save</button><button class="flex--item s-btn" type="button" data-action="s-modal#hide">Cancel</button></div><button class="s-modal--close s-btn s-btn__muted" aria-label="Close" data-action="s-modal#hide"><svg aria-hidden="true" class="svg-icon iconClearSm" width="14" height="14" viewBox="0 0 14 14"><path d="M12 3.41 10.59 2 7 5.59 3.41 2 2 3.41 5.59 7 2 10.59 3.41 12 7 8.41 10.59 12 12 10.59 8.41 7 12 3.41Z"></path></svg></button></div>`);a.find(`#${e}-save`).on("click",(t=>{t.preventDefault();const a=$(`#${e}-input`).val();void 0!==a&&a.length>0&&(GM_setValue(s,a),l().then((()=>{window.location.reload()})))})),t.append(a),$("body").append(t)})();const t=new RegExp(`^/users/${StackExchange.options.user.userId}.*`);if(null!==window.location.pathname.match(/^\/questions\/.*/))y();else if(null!==window.location.pathname.match(/^\/users$/)){const e=$(".js-filter-btn"),t=$('<a class="js-sort-preference-change flex--item s-btn s-btn__muted s-btn__outlined" href="/users?tab=case" data-nav-xhref="" title="Users who have been or are currently under investigation" data-value="plagiarist" data-shortcut="">Plagiarists</a>');if(e.append(t),window.location.search.startsWith(r)){(new C).init()}}else if(null!==window.location.pathname.match(t)){const e=$(`<a href="${window.location.pathname}?tab=case-manager-settings" class="s-navigation--item">Case Manager Settings</a>`);if($(".user-show-new .s-navigation:eq(0)").append(e),window.location.search.startsWith(i)){const e=$("#mainbar-full");e.empty(),(async()=>{const e=await c("/auth/credentials").then((e=>e.json())),t=$("<div></div>");t.append('<div class="s-page-title mb24"><h1 class="s-page-title--header m0 baw0 p0">Case Manager UserScript Settings</h1></div>');const n=$('<div class="d-grid grid__2 md:grid__1 g8"></div>');t.append(n);const i=$("<div></div>");n.append(i),i.append('<h3 class="fs-title mb12">Existing Auth Tokens</h3>');const o=$("<div></div>");i.append(o),e.forEach((e=>{const t=$('<div class="d-flex fd-row ai-center"></div>');o.append(t),t.append(`<span>${e}</span>`);const n=$('<button class="s-btn s-btn__danger">Invalidate</button>');n.on("click",(n=>{n.preventDefault(),c(`/auth/credentials/${e}/invalidate`).then((n=>{200===n.status&&(t.remove(),GM_getValue(s)===e&&(GM_deleteValue(s),GM_deleteValue(a),window.location.reload()))}))})),t.append(n)}));const r=$('<button class="s-btn s-btn__outlined s-btn__danger mt16" id="app-24380">De-authenticate Application</button>');i.append(r),r.on("click",(e=>{e.preventDefault(),StackExchange.helpers.showConfirmModal({title:"De-authenticate this Application",bodyHtml:"<p>Are you sure you want to de-authenticate this application? All existing access tokens will be invalidated and removed from storage. This app will no longer appear in your authorized applications list. You will no longer be able to use any existing access tokens and will need to reauthenticate to continue use.</p><p><b>Note:</b> All of your actions will be retained and associated to your user id even after de-authenticating. You may resume access at any time by authorising the application again.</p>",buttonLabel:"De-authenticate"}).then((e=>{e&&c(`/auth/credentials/${GM_getValue(s)}/de-authenticate`).then((e=>{200===e.status&&(GM_deleteValue(s),GM_deleteValue(a),window.location.reload())}))}))}));const l=$("<div></div>");return n.append(l),l.append('<h3 class="fs-title mb12">Issue new token</h3>'),l.append("<p>You can issue a new auth token for use on another device or to manually replace an existing token. Please invalidate any existing tokens, so they can no longer be used to access your information.</p>"),l.append(`<a class="s-link s-link__underlined" href="${d}" target="_blank" rel="noopener noreferrer">Issue new auth token</a>`),t})().then((t=>{e.append(t)}))}}else if(null!==window.location.pathname.match(/^\/users\/.*/)){const t=window.location.pathname.match(/^\/users\/\d+/g);if(null===t||1!==t.length)throw Error("Something changed in user path!");const a=Number(t[0].split("/")[2]),s=$(`<a href="${window.location.pathname}?tab=case-manager" class="s-navigation--item">Case Manager</a>`);c(`/case/user/${a}`).then((e=>e.json())).then((t=>{t.is_known_user&&s.prepend(e(16,20))}));const i=$(".user-show-new .s-navigation:eq(0)");if(i.append(s),window.location.search.startsWith(n)){const e="is-selected";i.find("a").removeClass(e),s.addClass(e);const t=$("#main-content"),n=new S(a);t.empty().append(n.init())}else window.location.search.startsWith(o)&&(()=>{const e=new x;e.updateSets();const t=new RegExp("users/tab/\\d+\\?tab=answers","gi");$(document).on("ajaxComplete",((a,s,{url:n})=>{n.match(t)&&e.updateSets()}))})()}};StackExchange.ready((()=>{T()}))}();