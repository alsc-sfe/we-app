---
order: 1
title: demo1
---

PC模板

````jsx
import './global';
import './style.less';
import { 
  setResourceLoader, setPageContainer, setRender,
  registerApps, start, 
  setHomepage, setContext, setRouterType, RouterType,
  usingHooks, configHooks } from "@alife/we-app";
import render from './render';
import hookConfigs from './hook-configs';

setRender(render);

setRouterType(RouterType.hash);

configHooks(hookConfigs);

registerApps([
  {
    url: 'https://g.alicdn.com/alsc-saas/web-boh-common/1.3.3/app-config.js',
  },
  {
    basename: '/boh/org',
    url: 'https://g.alicdn.com/alsc-saas/web-boh-org/1.0.4/app-config.js',
  },
]);

setHomepage('bcommon/account-settings');

start();
````
