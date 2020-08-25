/* 路由拦截与singleSpa初始化的顺序必须是事件拦截、初始化singleSpa、方法拦截 */
// 路由事件拦截
import './routing/event-intercept';
// singleSpa初始化
import { start as startSingleSpa } from 'single-spa';
// 路由方法拦截
import { startRouting } from './routing/routing';
/* 以上顺序不可动，否则无法做路由事件拦截 */

import { registerApps, requireChildrenInited,
  startRootProduct, usingHooks, configHooks, setHomepage, registerHookPages,
  setResourceLoader, setPageContainer, setRender, setRouterType, setBasename,
  setSkeletonContainer,
} from './weapp';
import { buildinHooks } from './hooks';
import { setContext } from './context';
import { DefaultResourceLoader } from '@saasfe/we-app-resource-loader';
import { RouterType } from '@saasfe/we-app-types';

let startPromise: Promise<any>;

// 设置resourceLoader
setResourceLoader(DefaultResourceLoader);

// 注册内置扩展
usingHooks(buildinHooks);

async function _start() {
  // 注册扩展页面
  await registerHookPages();
  // 确保所有节点都已经注册完成
  await requireChildrenInited();
  // 首次进入，触发路由拦截
  await startRouting();
  // 初始化页面
  startRootProduct();
  // singleSpa要求必须调用
  startSingleSpa();
}

export async function start() {
  if (!startPromise) {
    // 启动父应用
    startPromise = _start();
  } else {
    // 重启父应用，需要在上次启动之后
    startPromise.then(() => {
      startPromise = _start();
    });
  }
  return startPromise;
}

export {
  setResourceLoader,
  setPageContainer,
  setRender,
  setSkeletonContainer,

  DefaultResourceLoader,

  usingHooks,
  configHooks,

  registerApps,

  setHomepage,
  setContext,

  RouterType,
  setRouterType,
  setBasename,
};

export { RenderCustomProps, Route, RouteObj, RouteMatch, RouteMatchParams,
  Locate, GetGotoHrefParams, HookScope, SafeHookScope,
  ResourceLoader, ResourceLoaderDesc, Resource, ResourceFunction,
  ResourceWithType, ResourceType,
} from '@saasfe/we-app-types';
export { DefaultResourceLoaderOpts } from '@saasfe/we-app-resource-loader';
export { isFunction, navigate, getRouteSwitchConfig, getGotoHref,
  DEFAULTRouteMatch, AppLocation, parseLocate } from '@saasfe/we-app-utils';
