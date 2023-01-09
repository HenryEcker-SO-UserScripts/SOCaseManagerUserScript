import {
    type CaseGroupEntry,
    fetchFromAWS,
    type OpenCasesSummaryPageResponse,
    type UserCaseSummaryEntry
} from '../../API/AWSAPI';
import {buildSearchSvg} from '../../Utils/SVGBuilders';


function buildUserTile(account_id: number, profile_image: null | string, display_name: string, current_state: string, event_date: string) {
    const link = `/users/${account_id}${tabIdentifiers.userSummary}`;
    return $(`<div class="grid--item user-info">
                    ${profile_image !== null ? `<div class="user-gravatar48">
                        <a href="${link}"><div class="gravatar-wrapper-48"><img src="${profile_image}" alt="${display_name}'s user avatar" width="48" height="48" class="bar-sm"></div></a>
                    </div>` : ''}
                    <div class="user-details">
                        <a href="${link}">${display_name}</a>
                        <div class="d-flex fd-column mt6">
                            <span>Case ${current_state} on</span>
                            <span>${new Date(event_date).toLocaleString()}</span>
                        </div>
                    </div>
                </div>`);
}


export class CasesUserList {
    private needsTotalPages: boolean;
    private needsGroupInfo: boolean;
    private currentPage: number;
    private group: string;
    private search: string;
    private searchTimeout: NodeJS.Timeout | undefined; // Keeps from sending too many request
    private userData: UserCaseSummaryEntry[];
    private totalPages: number;
    private groupInfo: CaseGroupEntry[];

    constructor() {
        this.needsTotalPages = true;
        this.needsGroupInfo = true;
        this.currentPage = 1;
        this.totalPages = 1;
        this.group = '1';
        this.userData = [];
        this.search = '';
        this.groupInfo = [];
    }

    private setCurrentPage() {
        const usp = new URLSearchParams(window.location.search);
        if (usp.has(searchParamKeys.page)) {
            this.currentPage = Number(usp.get(searchParamKeys.page));
        }
        if (usp.has(searchParamKeys.group)) {
            this.group = usp.get(searchParamKeys.group) as string;
        }
        if (usp.has(searchParamKeys.search)) {
            this.search = usp.get(searchParamKeys.search) as string;
        }
    }

    private buildUsersURLWithParams(p?: number) {
        const usp = new URLSearchParams(tabIdentifiers.cases);
        usp.set(searchParamKeys.group, this.group);
        usp.set(searchParamKeys.page, (p === undefined ? this.currentPage : p).toString());
        if (this.search.length > 0) {
            usp.set(searchParamKeys.search, this.search);
        }
        return `/users?${usp.toString()}`;
    }

    private pullDownData() {
        // Can't use searchParamKeys here since these are defined on the API side
        // Changes to values here will be based on the API not local changes in the script
        const usp = new URLSearchParams();
        usp.set('group', this.group);
        usp.set('page', this.currentPage.toString());
        if (this.search.length > 0) {
            usp.set('search', this.search);
        }
        if (this.needsTotalPages) {
            usp.set('total-pages', 'true');
        }
        if (this.needsGroupInfo) {
            usp.set('group-info', 'true');
        }
        return fetchFromAWS(`/cases?${usp.toString()}`)
            .then(res => res.json())
            .then((resData: OpenCasesSummaryPageResponse) => {
                this.totalPages = resData.totalPages || this.totalPages;
                this.groupInfo = resData.groupInfo || this.groupInfo;
                this.userData = resData.cases;
            });
    }

    private pullDownAndRender() {
        return this.pullDownData().then(() => {
            this.render();
        });
    }

    init() {
        this.setCurrentPage();
        // Search
        const searchInput: JQuery<HTMLInputElement> = $('<input id="userfilter" name="userfilter" class="s-input s-input__search h100 wmx3" autocomplete="off" type="text" placeholder="Filter by user">');
        if (this.search.length > 0) {
            searchInput.val(this.search);
        }
        searchInput.on('input', (ev) => {
            clearTimeout(this.searchTimeout);
            if (this.search !== ev.target.value) {
                this.search = ev.target.value;
                this.searchTimeout = setTimeout(() => {
                    this.currentPage = 1;
                    this.needsTotalPages = true;
                    window.history.pushState('search_paging', '', this.buildUsersURLWithParams());
                    void this.pullDownAndRender();
                }, 450);
            }
        });

        $('#mainbar-full')
            .empty()
            .append(
                // Header
                $('<h1 class="fs-headline1 mb24">Plagiarists</h1>')
            )
            .append(
                // Search and Toggle
                $('<div class="d-flex fw-wrap ai-stretch md:d-block"></div>')
                    .append(
                        $('<div class="flex--item mb12 ps-relative"></div>')
                            .append(searchInput)
                            .append($(buildSearchSvg()))
                    )
                    .append(
                        // Other Page Toggle Component
                        $(`<div class="flex--item ml-auto mb12 h100 d-flex s-btn-group js-filter-btn">
    <a class="js-sort-preference-change flex--item s-btn s-btn__muted s-btn__outlined" href="/users?tab=reputation"
       data-nav-xhref="" title="Users with the highest reputation scores" data-value="reputation" data-shortcut=""
       aria-current="page"> Reputation</a>
    <a class="js-sort-preference-change flex--item s-btn s-btn__muted s-btn__outlined" href="/users?tab=newusers"
       data-nav-xhref="" title="Users who joined in the last 30 days" data-value="newusers" data-shortcut=""> New
        users</a>
    <a class="js-sort-preference-change flex--item s-btn s-btn__muted s-btn__outlined" href="/users?tab=voters"
       data-nav-xhref="" title="Users who voted more than 10 times" data-value="voters" data-shortcut=""> Voters</a>
    <a class="js-sort-preference-change flex--item s-btn s-btn__muted s-btn__outlined" href="/users?tab=editors"
       data-nav-xhref="" title="Users who edited at least 5 posts" data-value="editors" data-shortcut=""> Editors</a>
    <a class="js-sort-preference-change flex--item s-btn s-btn__muted s-btn__outlined" href="/users?tab=moderators"
       data-nav-xhref="" title="Our current community moderators" data-value="moderators" data-shortcut="">
        Moderators</a>
    <a class="js-sort-preference-change youarehere is-selected flex--item s-btn s-btn__muted s-btn__outlined" href="/users${tabIdentifiers.cases}"
       data-nav-xhref="" title="Users who have been or are currently under investigation" data-value="plagiarist"
       data-shortcut="">Plagiarists</a>
</div>`)
                    )
            )
            .append(
                // Group Selector
                $('<div class="fs-body2 mt8 mb12"><div class="d-flex jc-space-between"><div class="flex--item ml-auto md:ml0"><div id="tabs-interval" class="subtabs d-flex"></div></div></div></div>'))
            .append(// User Body Container
                $('<div id="user-browser" class="d-grid grid__4 lg:grid__3 md:grid__2 sm:grid__1 g12"></div>'))
            .append(
                // Pagination Container
                $('<div id="user-pagination" class="s-pagination site1 themed pager float-right"></div>')
            );

        // fetch then render
        void this.pullDownData().then(() => {
            // Not needed after initial set up
            this.needsTotalPages = false;
            this.needsGroupInfo = false;
            this.render();
        });
        window.addEventListener('popstate', () => {
            this.setCurrentPage();
            void this.pullDownAndRender();
        });
    }

    buildGroupToggleLink(group_id: string, description: string) {
        const usp = new URLSearchParams(tabIdentifiers.cases);
        usp.set(searchParamKeys.group, group_id);
        if (this.search.length > 0) {
            usp.set(searchParamKeys.search, this.search);
        }
        const href = `/users?${usp.toString()}`;
        const a = $(`<a${group_id === this.group ? ' class="youarehere is-selected"' : ''} href="${href}" data-nav-xhref="" data-value="${group_id}" data-shortcut="">${description}</a>`);
        a.on('click', (ev) => {
            ev.preventDefault();
            // Prevent nav to the same page
            if (this.group !== group_id) {
                window.history.pushState('group_paging', '', href);
                this.group = group_id;
                this.currentPage = 1; // Always reset paging to 1 on group switch
                this.needsTotalPages = true; // Also need new paging info for new group
                void this.pullDownAndRender();
            }
        });
        return a;
    }

    private buildGroupToggle() {
        const mountPoint = $('#tabs-interval').empty();
        this.groupInfo.forEach((entry) => {
            mountPoint.append(this.buildGroupToggleLink(entry.group_id, entry.description));
        });
    }

    private buildUserPanel() {
        const mountPoint = $('#user-browser').empty();
        this.userData.forEach((userData) => {
            mountPoint.append(buildUserTile(
                userData.investigated_user_id,
                userData.profile_image,
                userData.display_name,
                userData.current_state,
                userData.event_creation_date
            ));
        });
    }

    private buildNavItem(pageNumber: number, linkLabel?: string | number) {
        if (linkLabel === undefined) {
            linkLabel = pageNumber;
        }
        const href = this.buildUsersURLWithParams(pageNumber);
        const a = $(`<a class="s-pagination--item" href="${href}">${linkLabel}</a>`);
        a.on('click', (ev) => {
            ev.preventDefault();
            window.history.pushState('paging', '', href);
            this.currentPage = pageNumber;
            void this.pullDownAndRender();
        });
        return a;
    }


    private buildPagination() {
        const mountPoint = $('#user-pagination').empty();
        // No Pagination if there is only 1 page of results
        if (this.totalPages === 1) {
            return;
        }
        const buildPagesFromRange = (p: number) => {
            const pageNumber = p + 1;
            if (pageNumber === this.currentPage) {
                mountPoint.append(`<span class="s-pagination--item is-selected" aria-current="page">${pageNumber}</span>`);
            } else {
                mountPoint.append(this.buildNavItem(pageNumber));
            }
        };
        // Prev everywhere but the first page
        if (this.currentPage !== 1) {
            mountPoint.append(this.buildNavItem(this.currentPage - 1, 'Prev'));
        }
        const maxVisibleElements = 5;
        if (this.totalPages <= maxVisibleElements + 2) {
            [...Array(this.totalPages).keys()].forEach(buildPagesFromRange);
        } else {
            // Determine if there is a page gap on front end
            if (this.currentPage - maxVisibleElements >= 0) {
                mountPoint.append(this.buildNavItem(1));
                mountPoint.append('<span class="s-pagination--item s-pagination--item__clear">…</span>');
            }

            // Build Numbers in middle
            if (this.currentPage < maxVisibleElements) {
                [...Array(maxVisibleElements).keys()].forEach(buildPagesFromRange);
            } else if (this.currentPage > this.totalPages - maxVisibleElements) {
                [...Array(maxVisibleElements).keys()].forEach(p => {
                    buildPagesFromRange(this.totalPages - maxVisibleElements + p);
                });
            } else {
                [...Array(maxVisibleElements).keys()].forEach(p => {
                    buildPagesFromRange(this.currentPage - Math.ceil(maxVisibleElements / 2) + p);
                });
            }

            // Determine if there is a page gap on end
            if (this.totalPages - this.currentPage >= maxVisibleElements) {
                mountPoint.append('<span class="s-pagination--item s-pagination--item__clear">…</span>');
                mountPoint.append(this.buildNavItem(this.totalPages));
            }
        }
        // Next everywhere but the last page
        if (this.currentPage !== this.totalPages) {
            mountPoint.append(this.buildNavItem(this.currentPage + 1, 'Next'));
        }
    }

    private render() {
        this.buildGroupToggle();
        this.buildUserPanel();
        this.buildPagination();
    }
}