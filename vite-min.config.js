import buildConfig from './vite-shared-config';
import filterReplace from 'vite-plugin-filter-replace';

const minifiedConfig = buildConfig('SOCaseManager.min.user.js');

// Add additional plugin
minifiedConfig['plugins'] = [
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
    ...minifiedConfig['plugins']
];

// Don't delete full build in same folder
minifiedConfig['build']['emptyOutDir'] = false;

// Minify config
minifiedConfig['build']['minify'] = 'terser';
minifiedConfig['build']['terserOptions'] = {
    module: true,
    toplevel: true
};

export default minifiedConfig;