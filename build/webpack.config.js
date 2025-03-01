const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ZipPlugin = require('zip-webpack-plugin');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';

    const config = {
        mode: argv.mode,
        devtool: isProduction ? false : 'inline-source-map',
        entry: {
            popup: path.join(__dirname, '../src/popup/popup.js'),
            content: path.join(__dirname, '../src/content/content.js'),
            background: path.join(__dirname, '../src/background/background.js'),
        },
        output: {
            path: path.join(__dirname, '../dist'),
            filename: '[name].js',
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env'],
                        },
                    },
                },
                {
                    test: /\.css$/,
                    use: [
                        isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
                        'css-loader',
                    ],
                },
                {
                    test: /\.(png|jpg|jpeg|gif|svg)$/,
                    use: {
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                            outputPath: 'images',
                        },
                    },
                },
            ],
        },
        plugins: [
            new CleanWebpackPlugin({
                cleanStaleWebpackAssets: false,
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: path.join(__dirname, '../src/icons'),
                        to: path.join(__dirname, '../dist/icons'),
                    },
                    {
                        from: path.join(__dirname, '../manifest.json'),
                        to: path.join(__dirname, '../dist/manifest.json'),
                        transform: (content) => {
                            const manifest = JSON.parse(content.toString());
                            manifest.version = process.env.npm_package_version;
                            return JSON.stringify(manifest, null, 2);
                        },
                    },
                ],
            }),
            new HtmlWebpackPlugin({
                template: path.join(__dirname, '../src/popup/popup.html'),
                filename: 'popup.html',
                chunks: ['popup'],
            }),
            new MiniCssExtractPlugin({
                filename: '[name].css',
            }),
        ],
        resolve: {
            extensions: ['.js'],
            alias: {
                '@': path.resolve(__dirname, '../src'),
            },
        },
        performance: {
            hints: false,
        },
    };

    if (isProduction) {
        config.plugins.push(
            new ZipPlugin({
                path: path.join(__dirname, '../releases'),
                filename: `reddit-content-extractor-v${process.env.npm_package_version}.zip`,
            })
        );
    }

    return config;
};