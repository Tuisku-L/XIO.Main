const CracoLessPlugin = require('craco-less');
const {
    resolve
} = require('path');
const webpack = require("webpack");
const { loaderByName } = require('@craco/craco');

module.exports = {
    webpack: {
        configure: (conf) => {
            conf.resolve.alias["@"] = resolve("src");
            conf.target = "electron-renderer";
            return conf;
        }
    },
    plugins: [{
        plugin: CracoLessPlugin,
        options: {
            lessLoaderOptions: {
                lessOptions: {
                    javascriptEnabled: true,
                },
            },
            modifyLessRule: function (lessRule) {
                lessRule.exclude = /.less$/;
                return lessRule;
            },
            modifyLessModuleRule(lessModuleRule) {
                lessModuleRule.test = /.less$/;

                const cssLoader = lessModuleRule.use.find(loaderByName('css-loader'));
                cssLoader.options.modules = {
                    localIdentName: '[local]_[hash:base64:5]',
                };

                return lessModuleRule;
            }
        },
    },],
};
