import userscriptInfo from './package.json';


module.exports = {
    buildTamperMonkeyPreamble: (codeFileName, metaFileName) => {
        const userscriptConfig = {
            'name': 'SO Plagiarism Case Manager',
            'description': userscriptInfo.description,
            'homepage': userscriptInfo.repository.homepage,
            'author': userscriptInfo.author,
            'version': userscriptInfo.version,
            'downloadURL': `${userscriptInfo.repository.dist_url}${codeFileName}`,
            'updateURL': `${userscriptInfo.repository.dist_meta_url}${metaFileName}`,
            'match': [
                '*://stackoverflow.com/questions/*',
                '*://stackoverflow.com/users/*',
                '*://stackoverflow.com/users',
                '*://stackoverflow.com/users?*', // needed for TamperMonkey
            ],
            'exclude': [
                '*://stackoverflow.com/users/edit/*',
                '*://stackoverflow.com/users/delete/*',
                '*://stackoverflow.com/users/email/*',
                '*://stackoverflow.com/users/tag-notifications/*',
                '*://stackoverflow.com/users/preferences/*',
                '*://stackoverflow.com/users/hidecommunities/*',
                '*://stackoverflow.com/users/my-collectives/*',
                '*://stackoverflow.com/users/teams/*',
                '*://stackoverflow.com/users/mylogins/*',
                '*://stackoverflow.com/users/apps/*',
                '*://stackoverflow.com/users/message/*',
                '*://stackoverflow.com/users/saves/*',
                '*://stackoverflow.com/questions/ask*',
            ],
            'grant': ['GM_getValue', 'GM_setValue', 'GM_deleteValue']
        };

        const globals = ['$', 'StackExchange'];

        const preamble = ['// ==UserScript=='];

        const acc = [];
        let maxKeyLength = 0;
        Object.entries(userscriptConfig).forEach(([key, value]) => {
            if (value instanceof Array) {
                value.sort((a, b) => a.localeCompare(b)).forEach(v => acc.push([key, v]));
            } else {
                acc.push([key, value]);
            }
            if (key.length > maxKeyLength) {
                maxKeyLength = key.length;
            }
        });
        acc.forEach(([key, value]) => {
            preamble.push(`// @${key.padEnd(maxKeyLength)} ${value}`);
        });

        if (globals.length > 0) {
            preamble.push('// ==/UserScript==');
            preamble.push(`/* globals ${globals.join(', ')} */`);
        }
        preamble.push('\n');
        return preamble.join('\n');
    }
};