import buildConfig from './vite-shared-config';


const fullConfig = buildConfig('SOCaseManager.user.js');
// Runs first so make a clean directory
fullConfig['build']['emptyOutDir'] = true;
// Do not minify at all
fullConfig['build']['minify'] = false;

export default fullConfig;