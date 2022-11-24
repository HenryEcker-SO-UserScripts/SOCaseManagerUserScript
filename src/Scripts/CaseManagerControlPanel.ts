import type {
    CasePostDetailResponse
} from '../AWSAPI';
import {
    type CaseStateChangeResponse,
    type CaseSummaryCaseTimeline,
    type CaseSummaryPageResponse,
    type CaseSummaryPostSummary,
    fetchFromAWS
} from '../AWSAPI';
import type {StackExchangeAPI} from '../Globals';
import {fetchFromSEAPI, type SEAPIResponse} from '../SEAPI';
import {buildCheckmarkSvg} from '../Globals';

declare const StackExchange: StackExchangeAPI;


const buildCaseManagerPane = (userId: number, isActive: boolean) => {
    const container = $('<div class="grid--item"></div>');

    const config: {
        containerText: string;
        buttonText: string;
        apiRoute: string;
        buttonClasses: string;
        modalOptions: {
            title: string;
            body: string;
            buttonLabel: string;
        };
    } = isActive ? {
        containerText: 'This user is <strong>currently under investigation</strong>.',
        buttonText: 'Close current investigation',
        apiRoute: 'close',
        buttonClasses: 's-btn__primary',
        modalOptions: {
            title: 'Close Current Investigation',
            body: 'Are you sure you want to close out the current investigation of this user? This will remove the user from the active cases list. Please only do this if the majority of posts have either been actioned on or if the user is not a serial plagiarist.',
            buttonLabel: 'Yes, I\'m sure'
        }
    } : {
        containerText: 'This user is <u>not</u> currently under investigation.',
        buttonText: 'Open an investigation',
        apiRoute: 'open',
        buttonClasses: 's-btn__danger s-btn__filled',
        modalOptions: {
            title: 'Open An Investigation',
            body: 'Are you sure you want to open an investigation into this user? This will add this user to a list of users under investigation. Please only do this if you suspect the user of serial plagiarism.',
            buttonLabel: 'Yes, I\'m sure'
        }
    };


    container.append($('<h3 class="fs-title mb8">Case Management Console</h3>'));
    container.append($(`<p>${config['containerText']}</p>`));
    const button = $(`<button class="ml16 s-btn ${config['buttonClasses']}">${config['buttonText']}</button>`);
    button.on('click', (ev) => {
        ev.preventDefault();
        void StackExchange.helpers.showConfirmModal(config['modalOptions']).then(shouldContinue => {
            if (shouldContinue) {

                void (isActive ?
                        fetchFromAWS(`/case/${config['apiRoute']}`, {
                            'method': 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({'userId': userId})
                        })
                        :

                        // Grab user display name from API
                        fetchFromSEAPI(`/users/${userId}`, 'filter=!LnNkvqQOuAK0z-T)oydzPI')
                            .then(res => res.json())
                            .then((resData: SEAPIResponse<{ user_id: number; display_name: string; profile_image: string; }>) => {
                                if (resData.items.length === 0) {
                                    throw Error('User not found!');
                                }
                                const user = resData.items[0];
                                // Pass user info to CM
                                return fetchFromAWS(`/case/${config['apiRoute']}`, {
                                    'method': 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        'userId': user['user_id'],
                                        'displayName': user['display_name'],
                                        'profileImage': user['profile_image']
                                    })
                                });
                            })
                ).then((res) => {
                    if (res.status === 200) {
                        return res.json().then((resData: CaseStateChangeResponse) => {
                            return container.replaceWith(buildCaseManagerPane(userId, resData['hasOpenCase']));
                        });
                    } else if (res.status === 409) {
                        // Conflict means that the state is already in the appropriate configuration
                        return res.json().then((resData: CaseStateChangeResponse) => {
                            StackExchange.helpers.showToast(resData['message'], {
                                transientTimeout: 10000,
                                type: 'warning'
                            });
                            return container.replaceWith(buildCaseManagerPane(userId, resData['hasOpenCase']));
                        });
                    }
                    throw Error('Something went wrong');
                });
            }
        });
    });
    container.append(button);
    return container;
};

const buildActionsSummaryPane = (postSummary: CaseSummaryPostSummary) => {
    const container = $('<div class="grid--item p4 s-table-container"></div>');
    const actionTable = $('<table class="s-table"><thead><tr><th scope="col">Post Action</th><th scope="col">Number of Posts</th></tr></thead></table>');
    const actionTableBody = $('<tbody></tbody>');

    postSummary.forEach(post => {
        actionTableBody.append(
            $(`<tr><td>${post['action_taken']}</td><td>${post['number_of_posts']}</td></tr>`)
        );
    });

    actionTable.append(actionTableBody);
    container.append(actionTable);
    return container;
};

const buildCaseHistoryPane = (caseTimeline: CaseSummaryCaseTimeline) => {
    const container = $('<div class="grid--item p8"><h3 class="fs-title mb8">Investigation History</h3></div>');
    const timeline = $('<div class="d-flex fd-column gs4"></div>');
    caseTimeline.forEach(entry => {
        timeline.append(
            $(`<div class="flex--item d-flex fd-row jc-space-between ai-center" data-timeline-id="${entry['case_event_id']}"><a href="/users/${entry['account_id']}">${entry['display_name']}</a><span data-event-type-id="${entry['case_event_type_id']}">${entry['case_event_description']}</span><span>${new Date(entry['event_creation_date']).toLocaleString()}</span></div>`)
        );
    });
    container.append(timeline);
    return container;
};


type Page = 'summary' | 'posts';

export class CaseManagerControlPanel {
    private readonly container: JQuery;
    private readonly userId: number;
    private currentPage: Page;
    private readonly pageLoadMap: {
        summary: { isLoaded: boolean; pageData?: CaseSummaryPageResponse; };
        posts: { isLoaded: boolean; pageData?: CasePostDetailResponse; };
    };

    constructor(userId: number) {
        this.userId = userId;
        this.container = $('<div class="d-flex mb48"></div>');
        this.currentPage = 'summary';
        this.pageLoadMap = {'summary': {isLoaded: false}, 'posts': {isLoaded: false}};
    }

    private setCurrentPage() {
        const usp = new URLSearchParams(window.location.search);
        if (!usp.has('page') || usp.get('page') === 'summary') {
            this.currentPage = 'summary';
        } else if (usp.get('page') === 'posts') {
            this.currentPage = 'posts';
        }
    }


    init() {
        this.setCurrentPage();
        window.addEventListener('popstate', () => {
            this.setCurrentPage();
            this.render();
        });
        this.render();
        return this.container;
    }

    private buildNavLi(text: string, href: string, pageName: Page) {
        const li = $('<li></li>');
        const active = this.currentPage === pageName;
        const a = $(`<a class="s-navigation--item pr48 ps-relative${active ? ' is-selected' : ''}" href="${href}">${text}</a>`);
        a.on('click', (ev) => {
            ev.preventDefault();
            this.currentPage = pageName;
            if (!active) {
                window.history.pushState({'cmcPageName': pageName}, '', href);
                this.render();
            }
        });
        li.append(a);
        return li;
    }

    private buildNav() {
        const nav = $('<nav class="flex--item fl-shrink0 mr32" role="navigation"></nav>');
        const ul = $('<ul class="s-navigation s-navigation__muted s-navigation__vertical"></ul>');

        const pathName = window.location.pathname;
        const usp = new URLSearchParams(window.location.search);
        usp.set('page', 'summary');
        ul.append(this.buildNavLi('Summary', `${pathName}?${usp.toString()}`, 'summary'));

        usp.set('page', 'posts');
        ul.append(this.buildNavLi('Posts', `${pathName}?${usp.toString()}`, 'posts'));

        nav.append(ul);
        return nav;
    }

    private async getSummaryPageData(): Promise<CaseSummaryPageResponse> {
        if (this.pageLoadMap['summary'].isLoaded && this.pageLoadMap['summary'].pageData) {
            return this.pageLoadMap['summary'].pageData;
        } else {
            const summaryPageData = await fetchFromAWS(`/case/summary/${this.userId}`).then(res => res.json());
            this.pageLoadMap['summary'] = {
                isLoaded: true,
                pageData: summaryPageData
            };
            return summaryPageData;
        }
    }

    private async buildCaseSummaryPage() {
        const section = $('<section class="flex--item fl-grow1 wmx100"><div class="s-page-title mb24"><h1 class="s-page-title--header m0 baw0 p0">Summary</h1></section>');

        const summaryPageData: CaseSummaryPageResponse = await this.getSummaryPageData();
        const summaryPane = $('<div class="d-grid grid__2 md:grid__1 g8"></div>');

        summaryPane.append(buildCaseManagerPane(this.userId, summaryPageData['hasOpenCase']));
        summaryPane.append(buildActionsSummaryPane(summaryPageData['postSummary']));
        if (summaryPageData['caseTimeline'].length > 0) {
            summaryPane.append(buildCaseHistoryPane(summaryPageData['caseTimeline']));
        }

        section.append(summaryPane);
        return section;
    }


    private async getBreakdownData(): Promise<CasePostDetailResponse> {
        if (this.pageLoadMap['posts'].isLoaded && this.pageLoadMap['posts'].pageData) {
            return this.pageLoadMap['posts'].pageData;
        } else {
            const summaryPageData = await fetchFromAWS(`/case/posts/${this.userId}`).then(res => res.json());
            this.pageLoadMap['posts'] = {
                isLoaded: true,
                pageData: summaryPageData
            };
            return summaryPageData;
        }
    }

    private async buildPostsBreakdownPage() {
        const section = $(`<section class="flex--item fl-grow1 wmx100"><div class="s-page-title mb24">
    <h1 class="s-page-title--header m0 baw0 p0">Post Status Summary</h1></section>`);
        const detailData = await this.getBreakdownData();
        const detailTableContainer = $('<div class="s-table-container" style="width:min-content"></div>');
        const detailTable = $('<table class="s-table"></table>');
        {
            const detailTableHead = $('<thead></thead>');
            const detailTableHeadTr = $('<tr></tr>');
            detailData['header'].forEach((headerText) => {
                detailTableHeadTr.append(`<th>${headerText}</th>`);
            });
            detailTableHead.append(detailTableHeadTr);
            detailTable.append(detailTableHead);
        }
        {
            const detailTableBody = $('<tbody></tbody>');
            detailData['body'].forEach((row) => {
                const detailTableBodyTr = $('<tr></tr>');
                row.forEach((elem, idx) => {
                    if (idx === 0) {
                        detailTableBodyTr.append(`<td><a class="flex--item" href="/a/${elem}" target="_blank" rel="noreferrer noopener">${elem}</a></td>`);
                    } else {
                        if (elem !== null) {
                            detailTableBodyTr.append(`<td>${buildCheckmarkSvg()}</td>`);
                        } else {
                            detailTableBodyTr.append('<td></td>');

                        }
                    }
                });
                detailTableBody.append(detailTableBodyTr);
            });
            detailTable.append(detailTableBody);
        }
        detailTableContainer.append(detailTable);
        section.append(detailTableContainer);
        return section;
    }

    private rebuildContainer(section: JQuery<HTMLElement>) {
        this.container.empty();
        this.container.append(this.buildNav());
        this.container.append(section);
    }


    private render() {
        if (this.currentPage === 'summary') {
            void this.buildCaseSummaryPage()
                .then((section) => {
                    this.rebuildContainer(section);
                });
        } else if (this.currentPage === 'posts') {
            void this.buildPostsBreakdownPage()
                .then((section) => {
                    this.rebuildContainer(section);
                });
        }
    }

}