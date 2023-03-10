import banner from 'vite-plugin-banner';
import {buildTamperMonkeyPreamble} from './build_utils';
import path from 'path';

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
    Feedback: {
        LooksOK: 1,
        Edited: 2,
        Plagiarised: 3,
        Deleted: 4,
        Suspicious: 5
    }
};

export default (fileName) => {
    return {
        plugins: [
            banner(buildTamperMonkeyPreamble(fileName).replace(/^\s+/mg, ''))
        ],
        define: defObj,
        build: {
            rollupOptions: {
                input: {
                    main: path.resolve(__dirname, 'src', 'Main.ts')
                },
                output: {
                    format: 'iife',
                    manualChunks: undefined,
                    entryFileNames: fileName
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