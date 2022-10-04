const path = require('path');
const userscriptInfo = require('./package.json');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const {buildTamperMonkeyPreamble} = require('./build_utils');

const UserScriptConfig = {
    'name': 'SO Plagiarism Case Manager',
    'description': userscriptInfo.description,
    'homepage': userscriptInfo.repository.homepage,
    'author': userscriptInfo.author,
    'version': userscriptInfo.version,
    'downloadURL': userscriptInfo.repository.dist_url,
    'updateURL': userscriptInfo.repository.dist_url,
    'match': [
        '*://stackoverflow.com/questions/*',
        '*://stackoverflow.com/users/*',
        '*://stackoverflow.com/users'
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
        '*://stackoverflow.com/users/flag-summary/*',
    ],
    'grant': ['GM_getValue', 'GM_setValue', 'GM_deleteValue']
}

const globals = ['$', 'StackExchange'];


module.exports = {
    entry: './src/Main.ts',
    mode: 'production',
    target: 'browserslist',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: './SOCaseManager.user.js'
    },
    resolve: {
        extensions: ['.webpack.js', '.ts', '.tsx', '.js', '.css', '.scss']
    },
    plugins: [
        new CleanWebpackPlugin()
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                include: path.resolve(__dirname, 'src'),
                use: [
                    {
                        loader: 'string-replace-loader',
                        options: {
                            multiple: [
                                // Reduces excess space in elements built with jQuery
                                {
                                    search: />\s+</g,
                                    replace: '><',
                                },
                                {
                                    search: /\s{2,}/g,
                                    replace: ' ',
                                },
                                {
                                    search: /\n/g,
                                    replace: '',
                                }
                            ]
                        }
                    },
                    {loader: 'ts-loader'}
                ]
            }
        ]
    },
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin({
            terserOptions: {
                ecma: 2021,
                module: true,
                toplevel: true,
                format: {
                    preamble: buildTamperMonkeyPreamble(UserScriptConfig, globals).replace(/^\s+/mg, '')
                }
            }
        })]
    }
}