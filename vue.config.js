const path = require('path');
const webpack = require('webpack')
const CompressionWebpackPlugin = require('compression-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const productionGzipExtensions = ['js', 'css'];
// 是否为生产环境
const isProduction = process.env.NODE_ENV !== 'development'

function resolve(dir) {
    return path.join(__dirname, dir);
}
const cdn = {
    css: [
        'https://at.alicdn.com/t/font_830376_qzecyukz0s.css'
    ],
    js: [
        'https://cdn.bootcss.com/vue/2.5.17/vue.runtime.min.js',
        'https://cdn.bootcss.com/vue-router/3.0.1/vue-router.min.js',
        'https://cdn.bootcss.com/vuex/3.0.1/vuex.min.js',
        'https://cdn.bootcss.com/axios/0.18.0/axios.min.js',
    ],
}

module.exports = {
    lintOnSave: false,
    publicPath: './',
    assetsDir: 'static',
    productionSourceMap: false,
    chainWebpack: config => {
        config.resolve.alias.set('@', resolve('src'));
        // 优化moment 去掉国际化内容
        config
            .plugin('ignore')
            // 忽略/moment/locale下的所有文件
            .use(new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/))
        config.plugin('html')
            .tap(args => {
                args[0].cdn = cdn
                return args
            })
        // 开启图片压缩
        // config.module.rule('images')
        //     .test(/\.(png|jpe?g|gif|svg)(\?.*)?$/)
        //     .use('image-webpack-loader')
        //     .loader('image-webpack-loader')
        //     .options({
        //         bypassOnDebug: true
        //     })
        if (isProduction) {
            if (process.env.npm_config_report) {
                config
                    .plugin('webpack-bundle-analyzer')
                    .use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin)
                    .end()
                config.plugins.delete('prefetch')
            }
        }
    },
    configureWebpack: config => {
        // 用cdn方式引入
        config.externals = {
            vue: 'Vue',
            vuex: 'Vuex',
            'vue-router': 'VueRouter',
            axios: 'axios',
            "moment": "moment"
        };
        if (isProduction) {
            // 代码压缩
            config.plugins.push(
                new UglifyJsPlugin({
                    uglifyOptions: {
                        //生产环境自动删除console
                        compress: {
                            // warnings: false, // 若打包错误，则注释这行
                            drop_debugger: true,
                            drop_console: true,
                            pure_funcs: ['console.log']
                        }
                    },
                    sourceMap: false,
                    parallel: true
                })
            )
            //gizp压缩
            config.plugins.push(
                new CompressionWebpackPlugin({
                    filename: '[file].gz[query]',
                    algorithm: 'gzip',
                    test: new RegExp('\\.(' + productionGzipExtensions.join('|') + ')$'),
                    threshold: 10240,
                    minRatio: 0.8,
                    deleteOriginalAssets: false // 删除原文件
                })
            )
            // 公共代码抽离
            config.optimization = {
                splitChunks: {
                    cacheGroups: {
                        vendor: {
                            chunks: 'all',
                            test: /node_modules/,
                            name: 'vendor',
                            minChunks: 1,
                            maxInitialRequests: 5,
                            minSize: 0,
                            priority: 100
                        },
                        common: {
                            chunks: 'all',
                            test: /[\\/]src[\\/]js[\\/]/,
                            name: 'common',
                            minChunks: 2,
                            maxInitialRequests: 5,
                            minSize: 0,
                            priority: 60
                        },
                        styles: {
                            name: 'styles',
                            test: /\.(sa|le|sc|c)ss$/,
                            chunks: 'all',
                            enforce: true
                        },
                        runtimeChunk: {
                            name: 'manifest'
                        }
                    }
                }
            }
        }
    },
    devServer: {
        port: 8081,
        open: true, // 设置自动打开浏览器
    }
}