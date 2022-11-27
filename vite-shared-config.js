import banner from 'vite-plugin-banner';
import {buildTamperMonkeyPreamble} from './build_utils';
import path from 'path';
import filterReplace from 'vite-plugin-filter-replace';

// Defined variables
export const awsApiRoute = 'https://4shuk8vsp8.execute-api.us-east-1.amazonaws.com/prod';
const authRedirectUri = `${awsApiRoute}/auth/se/oauth`;
export const seTokenAuthRoute = `https://stackoverflow.com/oauth?client_id=24380&scope=no_expiry&redirect_uri=${authRedirectUri}`;

const defObj = {
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
    }
};

export default (fileName) => {
    return {
        plugins: [
            filterReplace([
                // Reduces excess space in elements built with jQuery
                {
                    replace: {
                        from: />\s+</g,
                        to: '><',
                    }
                },
                {
                    replace: {
                        from: /\s{2,}/g,
                        to: ' ',
                    }
                },
                {
                    replace: {
                        from: /\n/g,
                        to: '',
                    }
                }
            ]),
            banner(buildTamperMonkeyPreamble(fileName).replace(/^\s+/mg, ''))
        ],
        define: defObj,
        build: {
            rollupOptions: {
                input: {
                    main: path.resolve(__dirname, 'src', 'Main.ts')
                },
                output: {
                    banner: '(function() {"use strict";',
                    footer: '})();',
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