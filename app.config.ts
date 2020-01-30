module.exports = {
  // 模板类型 pc | h5
  viewType: 'pc',
  componentId: "762",
  componentType: "koubei-b-pc-ts",
  // 本地开发调试配置
  webpack: {
    // 主题配置
    themes: {},
    // devServer配置
    devServer: {
      host: 'local.koubei.test',
      port: 8000,
    },
  },
  // 组件发布前编译配置
  compile: {
    // 开启对antd/cook/qingtai组件按需加载， 默认false
    importHelper: false,
    // 开启UMD、System模块构建，将编译发布到CDN
    cdn: false,
    // 模块打包成UMD后的文件名前缀（需要自定义！！！）
    filename: 'layout',
    // 模块打包成UMD后的, 导出的模块名称（需要自定义！！！）
    library: "Layout",
    // 自定义UMD构建配置
    config: (compileConfig) => {
      return compileConfig;
    },
  },
};
