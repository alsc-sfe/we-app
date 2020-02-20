/* 路由拦截与singleSpa初始化的顺序必须是事件拦截、初始化singleSpa、方法拦截 */
// 路由事件拦截
import './routing/event-intercept';
// singleSpa初始化
import { start as startSingleSpa } from 'single-spa';
// 路由方法拦截
import { startRouting } from './routing/routing';

import { ProductConfig } from './weapp/product';
import { registerProducts, registerWeApps, setConfig, getChildrenInitStatus,
  startRootProduct, specifyHooks, setHomepage } from './weapp';
import { registerHooks } from './hooks';

export async function start(config: ProductConfig) {
  setConfig(config);
  await getChildrenInitStatus();
  // 首次进入，触发路由拦截
  await startRouting();
  // 初始化页面
  startRootProduct();
  // singleSpa要求必须调用
  startSingleSpa();
}

export {
  registerHooks,

  registerProducts,
  registerWeApps,
  setConfig,
  specifyHooks,
  setHomepage,
};
