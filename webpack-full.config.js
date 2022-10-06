const path = require('path');
const userscriptInfo = require('./package.json');
const TerserPlugin = require('terser-webpack-plugin');
const {buildTamperMonkeyPreamble} = require('./build_utils');


module.exports = {
    entry: './src/Main.ts',
    mode: 'production',
    target: 'browserslist',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: './SOCaseManager-full.user.js'
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
                    {loader: 'ts-loader'}
                ]
            }
        ]
    },
    optimization: {
        minimize: false,
        minimizer: [new TerserPlugin({
            terserOptions: {
                format: {
                    preamble: buildTamperMonkeyPreamble().replace(/^\s+/mg, '')
                }
            }
        })]
    }
}