---
order: 1
title: demo1
---

PC模板

````jsx
import './style.less';
import { 
  setResourceLoader, setPageContainer, setRender,
  registerApps, start, 
  setHomepage, setContext, setRouterType, RouterType,
  usingHooks, configHooks } from "@alife/we-app";
import render from './render';
import hookConfigs from './hook-configs';
import { getMicroApps } from './parser';
import initFetch from './fetch';
import isFrom3rdParty from './3rd-party';
import checkChooseOrg from '@alife/saas-check-choose-org';

const routerType = RouterType.hash;
window.MicroAppLoader = {
  routerType,
  RouterType,
};
setRouterType(routerType);

checkChooseOrg();

initFetch(isFrom3rdParty);

setContext({
  isFrom3rdParty,
});

setRender(render);

// usingHooks(null);

configHooks(hookConfigs);

// registerApps([
//   {
//     url: 'https://g.alicdn.com/alsc-saas/web-boh-common/1.3.3/app-config.js',
//   },
//   {
//     basename: '/boh/org',
//     url: 'https://g.alicdn.com/alsc-saas/web-boh-org/1.0.4/app-config.js',
//   },
// ]);

// setHomepage('bcommon/account-settings');

setPageContainer(document.querySelector('#__microfe-root-content'));
setPageContainer(document.querySelector('#bcommon__navbar'), ['bcommon/navbar']);
setPageContainer(document.querySelector('#bcommon__menu'), ['bcommon/menu']);

registerApps(window[Symbol.for('microAppsInfo')], getMicroApps);

start();
````
