import buildConfig from './vite-shared-config';


const fullConfig = buildConfig('SOCaseManager.user.js');
// Runs first so make a clean directory
fullConfig['build']['emptyOutDir'] = true;

// Minify config
fullConfig['build']['minify'] = 'terser';
fullConfig['build']['terserOptions'] = {
    compress: {
        defaults: false,
        properties: true,
        side_effects: true,
        evaluate: true,
        if_return: true,
        keep_classnames: true,
        keep_fnames: true
    },
    format: {
        braces: true,
        beautify: true,
        comments: false
    },
    mangle: false
};

export default fullConfig;