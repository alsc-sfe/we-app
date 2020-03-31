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
    },
  },
  // 组件发布前编译配置
  compile: {
    // 开启对antd/cook/qingtai组件按需加载， 默认false
    importHelper: false,
    // 开启UMD、System模块构建，将编译发布到CDN
    cdn: false,
    // 模块打包成UMD后的文件名前缀（需要自定义！！！）
    filename: 'weapp',
    // 模块打包成UMD后的, 导出的模块名称（需要自定义！！！）
    library: "WeApp",
    // 自定义UMD构建配置
    config: (compileConfig) => {
      return compileConfig;
    },
  },
  runtime: {
    heads: [
      // `
      // <link rel="stylesheet" href="https://gw.alipayobjects.com/os/lib/alife/cook-pc/3.22.7-beta.4/dist/antd.min.css">
      // <link rel="stylesheet" href="https://gw.alipayobjects.com/os/mentor/saas-node-crm-main/1.0.19/umd/index.css">
      // `,
      // `
      // <script src="https://gw.alipayobjects.com/os/lib/core-js-bundle/3.1.4/minified.js" crossorigin="anonymous"></script>
      // <script src="https://gw.alipayobjects.com/os/lib/regenerator-runtime/0.13.3/runtime.js" crossorigin="anonymous"></script>
      // `,
      // `
      // <script src="https://gw.alipayobjects.com/os/lib/systemjs/4.1.1/dist/system.js" crossorigin="anonymous"></script>
      // <script src="https://gw.alipayobjects.com/os/lib/systemjs/4.1.1/dist/extras/named-register.js" crossorigin="anonymous"></script>
      // `,
      // `
      // <script src="https://gw.alipayobjects.com/os/lib/moment/2.24.0/min/moment.min.js" crossorigin="anonymous"></script>
      // <script src="https://gw.alipayobjects.com/os/lib/moment/2.24.0/locale/zh-cn.js" crossorigin="anonymous"></script>
      // <script src="https://gw.alipayobjects.com/os/lib/alife/cook-pc/3.22.7-beta.4/dist/antd-with-locales.min.js" crossorigin="anonymous"></script>
      // <script src="https://gw.alipayobjects.com/os/lib/ant-design/icons/2.1.1/lib/umd.js" crossorigin="anonymous"></script>
      // `,
      `
      <script src="https://gw.alipayobjects.com/os/mentor/saas-fetch/2.0.6/umd/saas-fetch-min.js" crossorigin="anonymous"></script>
      <script src="https://gw.alipayobjects.com/os/mentor/saas-fetch-mtop/1.0.9/umd/saas-fetch-mtop.js" crossorigin="anonymous"></script>
      `,
      // `
      // <script src="https://g.alicdn.com/code/npm/@alife/system-react/1.0.1/library/umd/react-min.js" crossorigin="anonymous"></script>
      // <script src="https://g.alicdn.com/code/npm/@alife/system-react-dom/1.0.0/library/umd/react-dom-min.js" crossorigin="anonymous"></script>
      // `,
      // `
      // <script src="https://g.alicdn.com/code/npm/@alife/system-antd/1.0.1/library/umd/antd-min.js" crossorigin="anonymous"></script>
      // <script src="https://g.alicdn.com/code/npm/@alife/system-cook-pc/1.0.0/library/umd/cook-pc-min.js" crossorigin="anonymous"></script>
      // <script src="https://g.alicdn.com/code/npm/@alife/system-ant-design-icons/1.0.1/library/umd/ant-design-icons-min.js" crossorigin="anonymous"></script>
      // `,
      // `
      // <script src="https://g.alicdn.com/code/npm/@alife/system-saas-fetch/1.0.0/library/umd/saas-fetch-min.js" crossorigin="anonymous"></script>
      // <script src="https://g.alicdn.com/code/npm/@alife/system-saas-fetch-mtop/1.0.1/library/umd/saas-fetch-mtop-min.js" crossorigin="anonymous"></script>
      // `,
    ],
    bodies: [
      // `
      // <div id="microfe-layout" class="microfe-layout">
      //   <div class="microfe-navbar" id="bcommon__navbar"></div>
      //   <div class="microfe-body">
      //     <div class="microfe-menu" id="bcommon__menu"></div>
      //     <div class="microfe-wrapper">
      //       <div class="microfe-root-body">
      //         <div class="microfe-root-content" id="__microfe-root-content"></div>
      //       </div>
      //     </div>
      //   </div>
      // </div>
      // `,
      `
      <script>
      window.antd = window['@alife/cook-pc'] || window.antd;
      window.env = 'daily';
      window[Symbol.for('microAppsInfo')] = {
        // "alsc-saas/web-data-analysis":"0.3.3",
        "alsc-saas/web-boh-common":"1.3.4",
        // "alsc-saas/web-boh-setting":"1.1.3",
        // "alsc-saas/web-crm-personal":"1.2.0",
        "alsc-saas/web-boh-org":"1.0.6",
        // "alsc-saas/web-crm-member-mall":"2.0.4",
        // "alsc-saas/web-crm-dashboard":"1.2.7",
        // "alsc-saas/web-boh-pay-account":"1.0.3",
        // "alsc-saas/web-boh-print":"1.0.2",
        // "alsc-saas/web-crm-contract":"1.0.2",
        // "alsc-saas/web-crm-l100":"1.0.2",
        // "alsc-saas/web-crm-marketing":"1.7.3",
        // "alsc-saas/web-crm-card":"1.0.25",
        // "alsc-saas/web-boh-dish":"1.0.3",
        // "alsc-saas/web-boh-webpos":"1.0.7",
        // "alsc-saas/web-boh-data-stored":"1.1.8",
        // "alsc-saas/web-crm-channel":"3.1.1",
        // "alsc-saas/web-crm-member":"2.1.0",
        // "alsc-saas/web-crm-rights":"2.0.2",
        // "alsc-saas/web-crm-rules":"3.0.4",
        // "local": "http://local.koubei.test:8001/app-config.js",
      };
      </script>
      `,
    ],
    antd: {
      cdn: true,
    },
  },
};
