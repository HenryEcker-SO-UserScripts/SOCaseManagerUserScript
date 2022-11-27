import buildConfig from './vite-shared-config';

const minifiedConfig = buildConfig('SOCaseManager.min.user.js');

// Don't delete full build in same folder
minifiedConfig['build']['emptyOutDir'] = false;

// Minify config
minifiedConfig['build']['minify'] = 'terser';
minifiedConfig['build']['terserOptions'] = {
    module: true,
    toplevel: true
};

export default minifiedConfig;