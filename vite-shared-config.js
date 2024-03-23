import banner from 'vite-plugin-banner';
import {buildTamperMonkeyPreamble} from './build_utils';
import path from 'path';
import fs from 'fs';
import filterReplace from 'vite-plugin-filter-replace';
import replace from '@rollup/plugin-replace';
import handlePostFormComponents from './pre-buildable-stimulus-components/HandlePostFormComponents';
import nukePostSaveComponents from './pre-buildable-stimulus-components/NukePostSaveConfigComponents';

// Defined variables
export const awsApiRoute = 'https://4shuk8vsp8.execute-api.us-east-1.amazonaws.com/prod';
const authRedirectUri = `${awsApiRoute}/auth/se/oauth`;
export const seTokenAuthRoute = `https://stackoverflow.com/oauth?client_id=24380&scope=no_expiry&redirect_uri=${authRedirectUri}`;

const defObj = {
    searchParamKeys: {
        page: 'page',
        group: 'group',
        search: 'search',
        tableFilter: 'table-filter',
        tab: 'tab', // Technically "tab" is consumed as a search param key, but its usage is specified below
    },
    tabIdentifiers: {
        settings: '?tab=case-manager-settings',
        userSummary: '?tab=case-manager',
        userAnswers: '?tab=answers',
        cases: '?tab=case'
    },
    awsApiDefs: {
        awsApiBase: awsApiRoute,
        seTokenAuth: seTokenAuthRoute,
    },
    seApiDefs: {
        seAPIBase: 'https://api.stackexchange.com/2.3',
        apiKey: 'BkvRpNB*IzKMdjAcikc4jA(('
    },
    FeedbackIds: {
        LooksOK: 1,
        Plagiarised: 3,
        Suspicious: 5,
        Deleted: 4
    },
    RoleIds: {
        Admin: 1,
        CaseManager: 2,
        Investigator: 3
    },
    HANDLE_POST: handlePostFormComponents,
    SAVE_NUKE_CONFIG: nukePostSaveComponents
};


export default (codeFileName, metaFileName) => {
    const preamble = buildTamperMonkeyPreamble(codeFileName, metaFileName).replace(/^\s+/mg, '');
    return {
        plugins: [
            replace({
                preventAssignment: false,
                delimiters: ['\\b', '\\b'],
                values: Object.entries(defObj).reduce((acc, [key, value]) => {
                    acc[key] = JSON.stringify(value);
                    return acc;
                }, {})
            }),
            banner(preamble),
            filterReplace(
                [
                    {
                        replace:
                            {
                                from: /\s*\n+\s{2,}/gi,
                                to: '\n'
                            }
                    }
                ],
                {enforce: 'post'}
            ),
            {
                closeBundle() {
                    const metaDir = path.resolve(__dirname, 'dist', 'meta');
                    if (!fs.existsSync(metaDir)) {
                        fs.mkdirSync(metaDir);
                    }
                    fs.writeFileSync(
                        path.resolve(metaDir, metaFileName),
                        preamble
                    );
                }
            }
        ],
        build: {
            rollupOptions: {
                input: {
                    main: path.resolve(__dirname, 'src', 'Main.ts')
                },
                output: {
                    format: 'iife',
                    manualChunks: undefined,
                    entryFileNames: codeFileName
                }
            },
            outDir: './dist',
            assetsDir: '',
            sourcemap: false,
            target: ['ESNext'],
            reportCompressedSize: false
        }
    };
};