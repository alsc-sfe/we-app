---
order: 1
title: demo1
---

PC模板

````jsx
import './global';
import './style.less';
import { setConfig, registerWeApps, registerProducts, start, specifyHooks, setHomepage } from "@alife/we-app";
import render from './render';

setConfig({
  basicLibs: [
    '//gw.alipayobjects.com/os/lib/alife/cook-pc/3.22.7-beta.7/dist/antd.min.css',
    'https://gw.alipayobjects.com/os/mentor/saas-node-crm-main/1.0.19/umd/index.css',

    // 'https://gw.alipayobjects.com/os/lib/core-js-bundle/3.1.4/minified.js',
    // 'https://gw.alipayobjects.com/os/lib/regenerator-runtime/0.13.3/runtime.js',
    'https://gw.alipayobjects.com/os/lib/systemjs/4.1.1/dist/system.min.js',
    'https://gw.alipayobjects.com/os/lib/systemjs/4.1.1/dist/extras/named-register.min.js',
    // 'https://gw.alipayobjects.com/os/lib/react/16.8.6/umd/react.production.min.js',
    // 'https://gw.alipayobjects.com/os/lib/react-dom/16.8.6/umd/react-dom.production.min.js',
    'https://gw.alipayobjects.com/os/lib/moment/2.24.0/min/moment.min.js',
    'https://gw.alipayobjects.com/os/lib/moment/2.24.0/locale/zh-cn.js',
    'https://gw.alipayobjects.com/os/lib/alife/cook-pc/3.22.7-beta.7/dist/antd-with-locales.min.js',
    'https://gw.alipayobjects.com/os/lib/ant-design/icons/2.1.1/lib/umd.js',
    'https://gw.alipayobjects.com/os/mentor/saas-fetch/2.0.6/umd/saas-fetch-min.js',
    'https://gw.alipayobjects.com/os/mentor/saas-fetch-mtop/1.0.9/umd/saas-fetch-mtop.js',
    'https://g.alicdn.com/code/npm/@alife/system-react/1.0.1/library/umd/react-min.js',
    'https://g.alicdn.com/code/npm/@alife/system-react-dom/1.0.0/library/umd/react-dom-min.js',
    'https://g.alicdn.com/code/npm/@alife/system-antd/1.0.1/library/umd/antd-min.js',
    'https://g.alicdn.com/code/npm/@alife/system-cook-pc/1.0.0/library/umd/cook-pc-min.js',
    'https://g.alicdn.com/code/npm/@alife/system-ant-design-icons/1.0.1/library/umd/ant-design-icons-min.js',
    'https://g.alicdn.com/code/npm/@alife/system-saas-fetch/1.0.0/library/umd/saas-fetch-min.js',
    'https://g.alicdn.com/code/npm/@alife/system-saas-fetch-mtop/1.0.1/library/umd/saas-fetch-mtop-min.js',
  ],
  // 所有的微应用、页面的资源都用system加载
  useSystem: ['url'],
  render,
  404: function Page404() {
    return <div>This is 404 page</div>
  },
});

specifyHooks([
  [
    'skeleton', 
    {
      skeleton: `
        <div id="microfe-layout" class="microfe-layout">
          <div class="microfe-navbar" id="__bcommon__navbar"></div>
          <div class="microfe-body">
            <div class="microfe-menu" id="__bcommon__menu"></div>
            <div class="microfe-wrapper">
              <div class="microfe-root-body">
                <div class="microfe-root-content __weapp__content"></div>
              </div>
            </div>
          </div>
        </div>
      `,
      container: document.body,
      contentSelector: '.__weapp__content',
    },
  ],
  'basicLibs',
  ['404', {
    excludePages: ['bcommon/navbar', 'bcommon/menu'],
  }],
]);

registerWeApps([
  {
    url: 'https://g.alicdn.com/alsc-saas/web-boh-common/1.3.3/app-config.js',
  },
]);

setHomepage({
  weAppName: 'bcommon',
  pageName: 'account-settings',
});

start();

registerProducts([
  {
    name: 'boh',
    weApps: [
      {
        url: 'https://g.alicdn.com/alsc-saas/web-boh-org/1.0.4/app-config.js',
      },
    ],
  },
]);

start();
````
