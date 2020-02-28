/* 路由拦截与singleSpa初始化的顺序必须是事件拦截、初始化singleSpa、方法拦截 */
// 路由事件拦截
import './routing/event-intercept';
// singleSpa初始化
import { start as startSingleSpa } from 'single-spa';
// 路由方法拦截
import { startRouting } from './routing/routing';

import { ProductConfig } from './weapp/product';
import { registerProducts, registerWeApps, setConfig, requireChildrenInited,
  startRootProduct, specifyHooks, setHomepage, hookWeApp } from './weapp';
import { registerHooks, getLifecycleHook } from './hooks';

let startPromise: Promise<any>;

async function _start(config?: ProductConfig) {
  setConfig(config);
  // 注册hook.page
  const pageConfigs = getLifecycleHook('page');
  hookWeApp.registerPages(pageConfigs);
  // 确保所有节点都已经注册完成
  await requireChildrenInited();
  // 首次进入，触发路由拦截
  await startRouting();
  // 初始化页面
  startRootProduct();
  // singleSpa要求必须调用
  startSingleSpa();
}

export function start(config?: ProductConfig) {
  if (!startPromise) {
    startPromise = _start(config);
  } else {
    startPromise.then(() => {
      startPromise = _start(config);
    });
  }
}

export {
  registerHooks,

  registerProducts,
  registerWeApps,
  setConfig,
  specifyHooks,
  setHomepage,
};
