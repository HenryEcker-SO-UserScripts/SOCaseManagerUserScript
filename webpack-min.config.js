const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const {buildTamperMonkeyPreamble} = require('./build_utils');

const fileName = 'SOCaseManager.min.user.js'

module.exports = {
    entry: './src/Main.ts',
    mode: 'production',
    target: 'browserslist',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: `./${fileName}`
    },
    resolve: {
        extensions: ['.webpack.js', '.ts', '.tsx', '.js', '.css', '.scss']
    },
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
                    preamble: buildTamperMonkeyPreamble(fileName).replace(/^\s+/mg, '')
                }
            }
        })]
    }
}