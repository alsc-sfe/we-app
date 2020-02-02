/**
 * 生命周期钩子，可应用到产品、微应用级别
 * 1. 常规的钩子只在产品级别，而向基础库加载、基础dom渲染则需要到微应用级别，
 *    例如，在crm中嵌入商家中心的签约页面，在切换到签约页面路由时，需要加载基础库antd1
 * 2. 这样对于hook来说，就需要指定每个hook的应用范围，
 *    各个生命周期根据应用范围决定是否执行当前生命周期的钩子
 * 3. hook应用范围的指定，下放给各个产品、微应用，范围从小到大匹配，可以指定不使用的hook
 * 4. 默认所有hook在所有产品、微应用上启用，各个产品、微应用上只能禁用hook，配置从对应的层级上获取
 */
import { Hook, HookDesc, HookScope } from './type';
import { getPageName } from '../helpers';

// 登记hook
let Hooks: Hook<any>[] = [];
// hook默认配置
const HooksConfig: { [prop: string]: any } = {};
// hook拆解到生命周期
// { page: [pageConfig], beforeRouting: [] }
const LifecycleCache: { [prop: string]: any } = {
  page: [],
  beforeRouting: [],
  beforeLoad: [],
  beforeRender: [],
  afterUmount: [],
  onError: [],
};

export function registerHook(hook: Hook<any>, opts?: any) {
  const hooks: [Hook<any>, any][] = Array.isArray(hook) ? hook : [[hook, opts]];
  const newHooks = hooks.map(([h, o]) => {
    HooksConfig[h.hookName] = o;
    return h;
  });
  Hooks = Hooks.concat(newHooks);
}

function cachePage(hookDescPage: HookDesc['page'], scope: HookScope, hook: Hook<any>) {
  const { activityFunction, render } = hookDescPage;
  // 根据scope合成activityFunction，在框架整体运行时，再注册页面
  const hookPageName = getPageName({ hookName: hook.hookName });
  const pageConfig = LifecycleCache.page.find((c) => c.pageName === hookPageName);

  const scopePageName = getPageName(scope);
  const { pageName, weAppName, productName, page } = scope;
  let { weApp, product } = scope;
  const scopeActivityFunction = () => {
    if (pageName && page) {
      // 判断当前页面是否已激活，未激活返回false
      if (page.getStatus()) {
        return false;
      }

      weApp = page.weApp;
    } else if (weAppName && weApp) {
      // 判断当前微应用是否激活，未激活返回false
      if (weApp.getStatus()) {
        return false;
      }

      product = weApp.product;
    } else if (productName && product && product.getStatus()) {
      // 判断当前产品是否激活，未激活返回false
      return false;
    }
    // activityFunction
    return activityFunction();
  };

  if (pageConfig) {
    pageConfig.activityFunction.push(scopeActivityFunction);
    pageConfig.render[scopePageName] = render;
  } else {
    LifecycleCache.page.push({
      pageName: hookPageName,
      activityFunction: [scopeActivityFunction],
      render: {
        [scopePageName]: render,
      },
    });
  }
}

// useHooks 记录下来每个钩子对应的内容及配置
export function useHooks(config: [string, any][] = [], scope: HookScope) {
  config.forEach(([hname, opts]) => {
    const hook = Hooks.find((h) => h.hookName === hname);

    const hookOpts = {
      ...HooksConfig[hook.hookName],
      ...opts,
    };
    const hookDesc = hook(hookOpts) as HookDesc;

    if (hookDesc.page) {
      cachePage(hookDesc.page, scope, hook);
    }

    // beforeRouting 通过路由找到激活的页面，匹配页面和scope，确定当前生命周期是否执行
    // 其他的是在页面的生命周期内的，可以先根据scope筛选出fn列表，再执行
    ['beforeRouting', 'beforeLoad', 'beforeRender', 'onError'].forEach((name) => {
      if (hookDesc[name]) {
        const lifecycleCache = LifecycleCache[name].find(({ hookName }) => hookName === hook.hookName);
        if (lifecycleCache) {
          lifecycleCache.scope.unshift(scope);
        } else {
          LifecycleCache[name].push({
            scope: [scope],
            fn: hookDesc[name],
            hookName: hook.hookName,
          });
        }
      }
    });
  });
}

export function getLifecycleHook(lifecycleType: string) {
  return LifecycleCache[lifecycleType];
}
