import { Page404, Page403, Page500, Loading } from './components';

export default [
  {
    hookName: 'basicLibs',
    config: {
      url: [
        '//gw.alipayobjects.com/os/lib/alife/cook-pc/3.22.7-beta.7/dist/antd.min.css',
        'https://gw.alipayobjects.com/os/mentor/saas-node-crm-main/1.0.19/umd/index.css',

        // 'https://gw.alipayobjects.com/os/lib/core-js-bundle/3.1.4/minified.js',
        // 'https://gw.alipayobjects.com/os/lib/regenerator-runtime/0.13.3/runtime.js',
        // 'https://gw.alipayobjects.com/os/lib/systemjs/4.1.1/dist/system.min.js',
        'https://gw.alipayobjects.com/os/lib/systemjs/4.1.1/dist/extras/named-register.min.js',
        // 'https://gw.alipayobjects.com/os/lib/react/16.8.6/umd/react.production.min.js',
        // 'https://gw.alipayobjects.com/os/lib/react-dom/16.8.6/umd/react-dom.production.min.js',
        'https://gw.alipayobjects.com/os/lib/moment/2.24.0/min/moment.min.js',
        'https://gw.alipayobjects.com/os/lib/moment/2.24.0/locale/zh-cn.js',
        'https://gw.alipayobjects.com/os/lib/alife/cook-pc/3.22.7-beta.7/dist/antd-with-locales.min.js',
        'https://gw.alipayobjects.com/os/lib/ant-design/icons/2.1.1/lib/umd.js',
        // 'https://gw.alipayobjects.com/os/mentor/saas-fetch/2.0.6/umd/saas-fetch-min.js',
        // 'https://gw.alipayobjects.com/os/mentor/saas-fetch-mtop/1.0.9/umd/saas-fetch-mtop.js',
        'https://g.alicdn.com/code/npm/@alife/system-react/1.0.1/library/umd/react-min.js',
        'https://g.alicdn.com/code/npm/@alife/system-react-dom/1.0.0/library/umd/react-dom-min.js',
        'https://g.alicdn.com/code/npm/@alife/system-antd/1.0.1/library/umd/antd-min.js',
        'https://g.alicdn.com/code/npm/@alife/system-cook-pc/1.0.0/library/umd/cook-pc-min.js',
        'https://g.alicdn.com/code/npm/@alife/system-ant-design-icons/1.0.1/library/umd/ant-design-icons-min.js',
        'https://g.alicdn.com/code/npm/@alife/system-saas-fetch/1.0.0/library/umd/saas-fetch-min.js',
        'https://g.alicdn.com/code/npm/@alife/system-saas-fetch-mtop/1.0.1/library/umd/saas-fetch-mtop-min.js',
      ],
    },
  },
  {
    hookName: 'skeleton',
    config: {
      template: `
        <div class="microfe-layout">
          <div class="microfe-navbar __common_navbar"></div>
          <div class="microfe-body">
            <div class="microfe-menu __common_menu"></div>
            <div class="microfe-wrapper">
              <div class="microfe-root-body">
                <div class="microfe-root-content __content"></div>
              </div>
            </div>
          </div>
        </div>
      `,
      container: document.body,
      contentSelector: '.__content',
    },
  },
  {
    hookName: 'pageContainer',
    config: {
      specialSelectors: {
        'bcommon__navbar': '.__common_navbar',
        'bcommon__menu': '.__common_menu',
      },
    },
    scopes: [
      'bcommon/navbar',
      'bcommon/menu',
      'boh-layout/navbar',
    ],
  },
  {
    hookName: 'loading',
    config: {
      element: Loading,
    },
  },
  {
    hookName: '404',
    config: {
      page: {
        url: [Promise.resolve(Page404)],
      },
      excludePages: ['bcommon/navbar', 'bcommon/menu'],
    },
  },
  {
    hookName: '403',
    config: {
      page: {
        url: [Promise.resolve(Page403)],
      },
      excludePages: ['bcommon/navbar', 'bcommon/menu'],
      check403: async (pageAuth: any) => {
        const n = Math.random();
        const hasOrg = n < 0.2;
        const hasSign = n > 0.3 && n < 0.4;
        const orgPass = n > 0.8;
        const is403 = hasOrg || hasSign || orgPass;

        if (!pageAuth) {
          return;
        }

        if (!is403) {
          return false;
        }

        return { hasOrg, hasSign, orgPass };
      },
    },
  },
  {
    hookName: '500',
    config: {
      page: {
        url: [Promise.resolve(Page500)],
      },
    },
  },
]
