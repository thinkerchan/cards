const isProduction = process.env.NODE_ENV === 'production';
const argv = require('minimist')(process.argv.slice(2));
const isAlpha = !!argv.v;
const vConsolePlugin = require('vconsole-webpack-plugin')
let force = false;

const createPage = (name, title, chunk = '') => {
  return {
    entry: `src/pages/${name}/main.js`,
    template: 'public/index.html',
    filename: `${name}.html`,
    title,
    chunks: ['chunk-vendors', 'chunk-common', chunk || name],
  }
}

module.exports = {
  chainWebpack: (config) => {
    // 移除 prefetch 插件
    config.plugins.delete('prefetch')
    if (isProduction) {
      // config.optimization.delete('splitChunks')
      config.optimization.minimize(true);
    }
    if (isAlpha) {
      config.plugin('define').tap(args => {
        const obj = {
          packTime: new Date().toString()
        }
        args[0].kmspDevConfig = JSON.stringify(obj);
        return args;
      })
    }
  },
  configureWebpack: (config) => {

    if (force || (isProduction && !isAlpha)) { // 默认打包情况下去除vconsole
      config.optimization.minimizer[0].options.terserOptions.compress.drop_console = true
    }

    if (force || isAlpha) {
      let pluginsDev = [
        new vConsolePlugin({
          filter: [],
          enable: true
        })
      ]
      config.plugins = [...config.plugins, ...pluginsDev]
    }
  },
  productionSourceMap: false,
  publicPath: './', // 官方建议不要再pages配置下使用这个参数
  lintOnSave: false,
  pages: {
    index: createPage('index', '全国方言挑战赛!'),
    jumper: createPage('jumper', '全国方言挑战赛!'),
  }
}