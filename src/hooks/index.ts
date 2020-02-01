import { Hook, HookDesc } from './type';
import { GetPageNameOpts, getPageName } from '../helpers';

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
  onError: [],
};

export function registerHook(hook: Hook<any>, opts: any) {
  const hooks: [Hook<any>, any][] = Array.isArray(hook) ? hook : [[hook, opts]];
  const newHooks = hooks.map(([h, o]) => {
    HooksConfig[h.hookName] = o;
    return h;
  });
  Hooks = Hooks.concat(newHooks);
}

function cachePage(hookDescPage: HookDesc['page'], scope: GetPageNameOpts, hook: Hook<any>) {
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
export function useHooks(config: [string, any][] = [], scope: GetPageNameOpts) {
  config.forEach(([hookName, opts]) => {
    const hook = Hooks.find((h) => h.hookName === hookName);

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
        LifecycleCache[name].push({
          scope,
          fn: hookDesc[name],
        });
      }
    });
  });
}

export function getLifecycleHook(lifecycleType: string) {
  return LifecycleCache[lifecycleType];
}
