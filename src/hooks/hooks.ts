/**
 * 生命周期钩子，可应用到产品、微应用级别
 * 1. 常规的钩子只在产品级别，而基础库加载、基础dom渲染则需要到微应用级别，
 *    例如，在crm中嵌入商家中心的签约页面，在切换到签约页面路由时，需要加载基础库antd1
 * 2. 实际上是hook在不同级别工作时的配置不同，所以需要在每个级别可以指定对应hook的配置
 * 3. hook需要经过注册和启用两步，各个产品、微应用上可以启用、禁用hook
 */
import { Hook, HookDesc, HookScope } from './type';
import { getPageName } from '../helpers';
import { PageConfig } from '../weapp/page';
import singleSpa from '../single-spa';
import rootProduct from '../weapp/root-product';
import { errorHandler } from '../error';

// 登记hook
const HookDescs: HookDesc<any>[] = [];
const IncludeHooks: { hookName: string; scopes: HookScope<any>[] }[] = [];
const ExcludeHooks: { hookName: string; scopes: HookScope<any>[] }[] = [];
// hook拆解到生命周期
export interface LifecycleHook {
  hookName: string;
  exec: (opts?: HookScope<any>) => Promise<any>;
}
export const Lifecycles: string[] = [
  'beforeRouting', 'beforeLoad',
  'beforeMount', 'afterMount',
  'beforeUnmount', 'afterUnmount',
  'onError',
];
const LifecycleCache: {
  [prop: string]: (PageConfig|LifecycleHook)[];
} = (() => {
  const lifecycleCache = {
    page: [],
  };
  Lifecycles.forEach((l) => {
    lifecycleCache[l] = [];
  });
  return lifecycleCache;
})();

function registerHook(hook: Hook<any>|{hookName: string}, opts?: any) {
  let h = HookDescs.find(({ hookName }) => hookName === hook.hookName);

  if (h) {
    return h;
  }

  h = {
    ...(hook as Hook<any>)(opts),
    hookName: hook.hookName,
    opts,
  };

  HookDescs.push(h);

  return h;
}

export function registerHooks(hook: Hook<any>, opts?: any) {
  const hooks: [Hook<any>, any][] = Array.isArray(hook) ? hook : [[hook, opts]];

  hooks.forEach(([h, o]) => registerHook(h, o));
}

// 计算 resScopes 中与 destScopes 匹配的 scopes
function matchScopes(resScopes: HookScope<any>[], destScopes: HookScope<any>[]) {
  const matchedScopes: HookScope<any>[] = [];

  for (let i = 0, len = resScopes.length; i < len; i++) {
    const resScope = resScopes[i];

    for (let j = 0, l = destScopes.length; j < len; j++) {
      const destScope = destScopes[j];
      // 从页面到微应用到产品，范围逐步扩大
      if (resScope.pageName) {
        if (
          resScope.productName === destScope.productName &&
          resScope.weAppName === destScope.weAppName &&
          resScope.page === destScope.page
        ) {
          matchedScopes.push({
            ...resScope,
            matchedScope: {
              ...destScope,
            },
          });
        }
      } else if (resScope.weAppName) {
        if (
          resScope.productName === destScope.productName &&
          resScope.weAppName === destScope.weAppName
        ) {
          matchedScopes.push({
            ...resScope,
            matchedScope: {
              ...destScope,
            },
          });
        }
      } else if (resScope.productName &&
        resScope.productName === destScope.productName
      ) {
        matchedScopes.push({
          ...resScope,
          matchedScope: {
            ...destScope,
          },
        });
      }
    }
  }

  return matchedScopes;
}

function matchActiveScopes(hookName: string, activeScopes: HookScope<any>[],
  matchedActiveScopes: { [hookName: string]: HookScope<any>[] } = {}) {
  const includeHook = IncludeHooks.find(({ hookName: hname }) => hookName === hname);
  const enabledScopes = includeHook.scopes;

  const excludeHook = ExcludeHooks.find(({ hookName: hname }) => hookName === hname);
  const disabledScopes = excludeHook.scopes;

  // 没有级别启用当前插件
  if (!enabledScopes) {
    return false;
  }

  const matchedEnabledActiveScopes: HookScope<any>[] = matchScopes(activeScopes, enabledScopes);
  // 没有匹配的启用scope
  if (!matchedEnabledActiveScopes.length) {
    return false;
  }

  const matchedDisabledActiveScopes: HookScope<any>[] = matchScopes(activeScopes, disabledScopes);
  if (!matchedDisabledActiveScopes.length) {
    matchedActiveScopes[hookName] = matchedEnabledActiveScopes;
    return true;
  }

  const matchedExcludeActiveScopes = matchScopes(matchedEnabledActiveScopes, matchedDisabledActiveScopes);

  matchedExcludeActiveScopes.forEach((scope) => {
    const pageName = getPageName(scope);
    const index = matchedEnabledActiveScopes.findIndex((s) => getPageName(s) === pageName);
    if (index > -1) {
      matchedEnabledActiveScopes.splice(index, 1);
    }
  });

  if (!matchedExcludeActiveScopes.length) {
    return false;
  }

  matchedActiveScopes[hookName] = matchedEnabledActiveScopes.map(({ matchedScope, ...rest }) => ({
    ...rest,
    enabledScope: matchedScope,
  }));
  return true;
}

function cachePage(hookDescPage: HookDesc<any>['page'], hookDesc: HookDesc<any>) {
  const { activityFunction, render } = hookDescPage;
  // 根据scope合成activityFunction，在框架整体运行时，再注册页面
  const hookPageName = getPageName({ hookName: hookDesc.hookName });

  const scopeActivityFunction = (location: Location) => {
    // 获取当前路由对应的页面对应的scope
    const activePages = singleSpa.checkActivityFunctions(location);
    const activeScopes = activePages.map((pageName) => {
      return rootProduct.getScope(pageName);
    });
    // 匹配启用scope和禁用scope
    const isScopeMatched = matchActiveScopes(hookDesc.hookName, activeScopes);

    if (!isScopeMatched) {
      return false;
    }

    return activityFunction(location);
  };

  let pageConfig: PageConfig = LifecycleCache.page.find((c) => c.hookName === hookDesc.hookName);
  if (!pageConfig) {
    pageConfig = {
      hookName: hookDesc.hookName,
      name: hookPageName,
      activityFunction: scopeActivityFunction,
      render,
    };
    LifecycleCache.page.push(pageConfig);
  }
}

// useHooks 拆解每个钩子的内容并缓存到生命周期
export interface DisabledHook {
  hookName: string;
  disabled: true;
}
export type UseHookParams = string | [string] | [string, any] | DisabledHook |
Hook<any> | [Hook<any>] | [Hook<any>, any] |
(string|Hook<any>) | [(string|Hook<any>)] | [(string|Hook<any>), any];

export type UseHooksParams = UseHookParams[];

function enableHook(hookDesc: HookDesc<any>, scope: HookScope<any>) {
  const { hookName } = hookDesc;
  const includeHook = IncludeHooks.find(({ hookName: hname }) => {
    return hookName === hname;
  });
  // 记录scope
  if (includeHook) {
    includeHook.scopes.push(scope);
  } else {
    IncludeHooks.push({
      hookName,
      scopes: [scope],
    });
  }

  // 将启用的插件拆解到生命周期缓存
  if (hookDesc.page) {
    cachePage(hookDesc.page, hookDesc);
  }

  Lifecycles.forEach((name) => {
    if (hookDesc[name]) {
      const lifecycleCache = LifecycleCache[name].find(({ hookName: hname }) => hname === hookDesc.hookName);
      if (!lifecycleCache) {
        LifecycleCache[name].push({
          exec: hookDesc[name],
          hookName: hookDesc.hookName,
        });
      }
    }
  });
}

function disableHook(hookName: string, scope: HookScope<any>) {
  const excludeHook = ExcludeHooks.find(({ hookName: hname }) => {
    return hookName === hname;
  });
  if (excludeHook) {
    excludeHook.scopes.push(scope);
  } else {
    ExcludeHooks.push({
      hookName,
      scopes: [scope],
    });
  }
}

function specifyHook(useHookParams: UseHookParams, scope: HookScope<any>) {
  let params: UseHookParams|UseHookParams[] = useHookParams;
  if (!Array.isArray(params)) {
    params = [params];
  }

  const [hookName, opts] = params;
  // 在hook scope上记录当前需要的opts
  // 避免引用问题，重新创建scope对象
  const hookScope = {
    ...scope,
    opts,
  };
  // 记录禁用的hook
  // 判断hook是否禁用，禁用则记录在 ExcludeHooks
  const disabledHook = hookName as DisabledHook;
  if (disabledHook.disabled) {
    disableHook(disabledHook.hookName, hookScope);
  } else {
    // 记录启用的hook、scope、opts
    let hook: Hook<any>|{hookName: string} = hookName as Hook<any>;
    if (typeof hookName === 'string') {
      hook = {
        hookName,
      };
    }
    // 先注册钩子
    const hookDesc = registerHook(hook, opts);
    // 拆解到生命周期钩子缓存
    enableHook(hookDesc, hookScope);
  }
}

// hooks: [ [ hookName, opts ], [ hook, opts ], { hookName, disabled: true } ]
export function specifyHooks(params: boolean | UseHooksParams, scope: HookScope<any>) {
  let useHooksParams = params as UseHooksParams;
  if (typeof params === 'boolean') {
    if (params) {
      // 在当前级别启用所有插件
      useHooksParams = HookDescs.map(({ hookName }) => hookName);
    } else {
      // 在当前级别禁用所有插件
      useHooksParams = HookDescs.map(({ hookName }) => ({
        hookName,
        disabled: true,
      }));
    }
  }

  useHooksParams.forEach((useHookParams) => {
    specifyHook(useHookParams, scope);
  });
}

function getLifecycleHook(lifecycleType: string) {
  return LifecycleCache[lifecycleType];
}

export function runLifecycleHook(lifecycleType: string, activeScopes: HookScope<any>[], props?: any) {
  const lifecycleHooks: LifecycleHook[] = getLifecycleHook(lifecycleType) as LifecycleHook[];
  const matchedActiveScopes: {[hookName: string]: HookScope<any>[]} = {};
  // 先过滤出需要执行的hook
  // 再执行相应的hook处理函数
  return lifecycleHooks
    .filter(({ hookName }) => {
      const isScopeMatched = matchActiveScopes(hookName, activeScopes, matchedActiveScopes);
      return isScopeMatched;
    })
    .reduce(async (p, { hookName, exec }) => {
      const hookDesc = HookDescs.find(({ hookName: hname }) => hname === hookName);
      // 像路由切换前，根据url是可以匹配到多个页面的
      // 所以每个页面在剔除禁用的之后，都需要执行一次钩子函数
      const hookMatchedActiveScopes = matchedActiveScopes[hookName];

      await p;

      if (typeof exec === 'function') {
        return hookMatchedActiveScopes.map((hookMatchedActiveScope) => {
          const { enabledScope: hookScope } = hookMatchedActiveScope;
          return exec({
            ...hookMatchedActiveScope,
            ...props,
            errorHandler: (error: Event) => {
              return errorHandler(error, [hookMatchedActiveScope]);
            },
            opts: {
              ...hookDesc.opts,
              ...hookScope.opts,
            },
          });
        });
      }
    }, Promise.resolve([undefined]));
}
