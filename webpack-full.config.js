const path = require('path');
const userscriptInfo = require('./package.json');
const TerserPlugin = require('terser-webpack-plugin');
const {buildTamperMonkeyPreamble} = require('./build_utils');
const webpack = require('webpack');


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
    plugins: [
        new webpack.BannerPlugin({
            banner: buildTamperMonkeyPreamble().replace(/^\s+/mg, ''),
            raw: true
        })
    ],
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
        minimize: false
    }
}