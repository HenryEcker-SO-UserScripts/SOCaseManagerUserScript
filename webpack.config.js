const path = require('path');
const {buildTamperMonkeyPreamble} = require('./build_utils');
const webpack = require('webpack');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');


const fileName = 'SOCaseManager.user.js';

module.exports = {
    entry: './src/Main.ts',
    mode: 'production',
    target: 'browserslist',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename:  `./${fileName}`
    },
    resolve: {
        extensions: ['.webpack.js', '.ts', '.tsx', '.js', '.css', '.scss']
    },
    plugins: [
        new CleanWebpackPlugin(),
        new webpack.BannerPlugin({
            banner: buildTamperMonkeyPreamble(fileName).replace(/^\s+/mg, ''),
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