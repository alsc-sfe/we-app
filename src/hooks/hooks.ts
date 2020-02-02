/**
 * 生命周期钩子，可应用到产品、微应用级别
 * 1. 常规的钩子只在产品级别，而基础库加载、基础dom渲染则需要到微应用级别，
 *    例如，在crm中嵌入商家中心的签约页面，在切换到签约页面路由时，需要加载基础库antd1
 * 2. 实际上是hook在不同级别工作时的配置不同，所以需要在每个级别可以指定对应hook的配置
 * 3. hook默认全站启用，各个产品、微应用上可以禁用hook
 */
import { Hook, HookDesc, HookScope } from './type';
import { getPageName } from '../helpers';
import { PageConfig } from '../weapp/page';
import singleSpa from '../single-spa';
import rootProduct from '../weapp/root-product';

// 登记hook
let Hooks: HookDesc[] = [];
const ExcludeHooks: { hookName: string; scopes: HookScope[] }[] = [];
// hook拆解到生命周期
export interface LifecycleHook {
  hookName: string;
  excludeScopes: HookScope[];
  exec: (opts?: any) => void;
}
const LifecycleCache: {
  [prop: string]: (PageConfig|LifecycleHook)[];
} = {
  page: [],
  beforeRouting: [],
  beforeLoad: [],
  beforeRender: [],
  afterUmount: [],
  onError: [],
};

export function registerHooks(hook: Hook<any>, opts?: any) {
  const hooks: [Hook<any>, any][] = Array.isArray(hook) ? hook : [[hook, opts]];

  const rhooks = hooks.map(([h, o]) => {
    return {
      ...h(o),
      hookName: h.hookName,
    };
  });

  Hooks = Hooks.concat(rhooks);
}

export type DisabledHooks = boolean | string[];

export function disableHooks(disabledHooks: DisabledHooks, scope: HookScope) {
  let excludeHooks: string[] = disabledHooks as string[];
  if (typeof disabledHooks === 'boolean') {
    excludeHooks = Hooks.map(({ hookName }) => {
      return hookName;
    });
  }

  excludeHooks.forEach((hname) => {
    const excludeHook = ExcludeHooks.find(({ hookName }) => {
      return hookName === hname;
    });
    if (excludeHook) {
      excludeHook.scopes.push(scope);
    } else {
      ExcludeHooks.push({
        hookName: hname,
        scopes: [scope],
      });
    }
  });
}

function matchScope(excludeScope: HookScope, activeScope: HookScope) {
  if (excludeScope.pageName &&
    excludeScope.productName === activeScope.productName &&
    excludeScope.weAppName === activeScope.weAppName &&
    excludeScope.page === activeScope.page) {
    return true;
  } else if (excludeScope.weAppName &&
    excludeScope.productName === activeScope.productName &&
    excludeScope.weAppName === activeScope.weAppName
  ) {
    return true;
  } else if (excludeScope.productName &&
    excludeScope.productName === activeScope.productName
  ) {
    return true;
  }
}

function cachePage(hookDescPage: HookDesc['page'], excludeScopes: HookScope[], hookDesc: HookDesc) {
  const { activityFunction, render } = hookDescPage;
  // 根据scope合成activityFunction，在框架整体运行时，再注册页面
  const hookPageName = getPageName({ hookName: hookDesc.hookName });

  const scopeActivityFunction = (location: Location) => {
    // 获取当前路由对应的页面对应的scope
    // 将需排除的scope与当前匹配的scope进行比对
    // 当存在于被排除的scope中时，则返回false
    const activePages = singleSpa.checkActivityFunctions(location);
    const activeScopes = activePages.map((pageName) => {
      return rootProduct.getScope(pageName);
    });

    for (let i = 0, len = excludeScopes.length; i < len; i++) {
      const excludeScope = excludeScopes[i];
      for (let j = 0, l = activeScopes.length; j < len; j++) {
        const activeScope = activeScopes[j];
        const isScopeMatched = matchScope(excludeScope, activeScope);
        if (isScopeMatched) {
          return false;
        }
      }
    }

    return activityFunction(location);
  };

  let pageConfig: PageConfig = LifecycleCache.page.find((c) => c.hookName === hookDesc.hookName);
  if (pageConfig) {
    pageConfig.activityFunctions.push(scopeActivityFunction);
  } else {
    pageConfig = {
      hookName: hookDesc.hookName,
      name: hookPageName,
      activityFunctions: [scopeActivityFunction],
      render,
    };
    LifecycleCache.page.push(pageConfig);
  }
}

// useHooks 记录下来每个钩子对应的内容及配置
export function useHooks() {
  Hooks.forEach((hookDesc) => {
    let excludeScopes = [];
    const excludeHook = ExcludeHooks.find(({ hookName }) => hookName === hookDesc.hookName);
    if (excludeHook) {
      excludeScopes = excludeHook.scopes;
    }

    if (hookDesc.page) {
      cachePage(hookDesc.page, excludeScopes, hookDesc);
    }

    // beforeRouting 通过路由找到激活的页面，匹配页面和scope，确定当前生命周期是否执行
    // 其他的是在页面的生命周期内的，可以先根据scope筛选出fn列表，再执行
    ['beforeRouting', 'beforeLoad', 'beforeRender', 'onError'].forEach((name) => {
      if (hookDesc[name]) {
        const lifecycleCache = LifecycleCache[name].find(({ hookName }) => hookName === hookDesc.hookName);
        if (lifecycleCache) {
          lifecycleCache.excludeScopes = lifecycleCache.excludeScopes.concat(excludeScopes);
        } else {
          LifecycleCache[name].push({
            excludeScopes,
            exec: hookDesc[name],
            hookName: hookDesc.hookName,
          });
        }
      }
    });
  });
}

export function getLifecycleHook(lifecycleType: string) {
  return LifecycleCache[lifecycleType];
}

export function runLifecycleHook(lifecycleType: string, activeScopes: HookScope[], opts?: any) {
  const hooks: LifecycleHook[] = getLifecycleHook(lifecycleType) as LifecycleHook[];
  // 先过滤出需要执行的hook
  // 再执行相应的hook处理函数
  return hooks
    .filter(({ excludeScopes }) => {
      const matchedExcludeScope = excludeScopes.find((excludeScope) => {
        const matchedActiveScope = activeScopes.find((activeScope) => {
          const isScopeMatched = matchScope(excludeScope, activeScope);
          return isScopeMatched;
        });
        return matchedActiveScope;
      });
      return !matchedExcludeScope;
    })
    .reduce(async (p, { exec }) => {
      await p;
      return exec(opts);
    }, Promise.resolve(undefined));
}
