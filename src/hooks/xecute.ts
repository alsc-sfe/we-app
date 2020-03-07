import { HookDescRunnerParam, HookScope, LifecycleHookEnum } from './type';
import { getHooksScopes, getScopeHooks, getScopeHookNames } from './specify';
import { getScopeName } from '../helpers';
import { BaseType } from '../weapp/base';
import { getPageConfigs } from './register';
import { errorHandler } from '../error';
import { getScope, compoundScope } from '../weapp';
import { PageConfig } from '../weapp/page';
import { getAppStatus, unloadApplication, UNLOADING, NOT_LOADED } from 'single-spa';

const MatchedPageScope: { [pageName: string]: HookDescRunnerParam<any> } = {};
let EnabledHookScopes: HookDescRunnerParam<any>[] = [];

export function getEnabledHookNames() {
  let enabledHookNames = [];
  EnabledHookScopes.forEach(({ hookScope }) => {
    const scopeHookNames = getScopeHookNames(hookScope.scopeName);
    enabledHookNames = enabledHookNames.concat(scopeHookNames);
  });
  return Array.from(new Set(enabledHookNames));
}

function matchHooksScope(activePageScope: HookScope) {
  const pageScopeName = getScopeName(activePageScope);
  activePageScope.scopeName = pageScopeName;

  if (MatchedPageScope[pageScopeName]) {
    return MatchedPageScope[pageScopeName];
  }

  const weAppScopeName = getScopeName({ ...activePageScope, pageName: '' });
  const productScopeName = getScopeName({ ...activePageScope, weAppName: '', pageName: '' });
  const activeScopeNames = [pageScopeName, weAppScopeName, productScopeName];
  // 根据activePageScope匹配hooksScope，一个页面只会有一个hooksScope
  const hooksScopes = getHooksScopes();
  const matchedHooksScopes = hooksScopes.map((hooksScope) => {
    const hookScope = typeof hooksScope === 'string' ? getScope(hooksScope) : hooksScope;
    return hookScope;
  }).filter((hookScope) => {
    const matched = activeScopeNames.indexOf(hookScope.scopeName) > -1;
    if (matched) {
      return true;
    }

    return (
      !hookScope.pageName &&
      !hookScope.weAppName &&
      hookScope.product.type === BaseType.root
    );
  });

  let matchedHooksScope = matchedHooksScopes[0];
  if (matchedHooksScopes.length > 1) {
    // 从多个匹配的scope中选择作用域最小的一个
    // 作用域最小则长度最长
    const len = [];
    matchedHooksScopes.map((scope) => {
      return [
        scope,
        scope.productName,
        scope.pageName,
        scope.pageName,
      ].filter((m) => m);
    }).forEach((m) => {
      len[m.length] = m;
    });
    matchedHooksScope = len[len.length - 1][0];
  }

  const hookDescRunnerParam = {
    pageScope: activePageScope,
    hookScope: matchedHooksScope,
  };
  MatchedPageScope[pageScopeName] = hookDescRunnerParam;

  return hookDescRunnerParam;
}

function matchHooksScopes(activePageScopes: HookScope[]) {
  const lastEnabledHookScopes = [...EnabledHookScopes];
  // 根据activePageScope匹配hooksScope，一个页面只会有一个hooksScope
  const enabledHookScopes = activePageScopes.map((activePageScope) => {
    return matchHooksScope(activePageScope);
  });
  EnabledHookScopes = enabledHookScopes;
  // 计算新启用hookScopes
  const newEnabledHookScopes: HookDescRunnerParam<any>[] = [];
  // 计算已启用hookScopes
  const alreadyEnabledHookScopes: HookDescRunnerParam<any>[] = [];
  // 计算禁用hookScopes
  // 找到上一个scope在当前scope中不存在的
  const disabledHookScopes: HookDescRunnerParam<any>[] = [...lastEnabledHookScopes];

  enabledHookScopes.forEach((enabledHookScope) => {
    const { hookScope } = enabledHookScope;
    // 不在上一次的启用hookScopes中，则为新启用hookScopes
    // 在上一次的启用hookScopes中，则为已启用hookScopes，并移除
    // 上一次启用hookScopes中剩余的就是本次需要禁用的hookScopes
    const index = disabledHookScopes.findIndex(({ hookScope: lastHookScope }) => {
      return hookScope.scopeName === lastHookScope.scopeName;
    });
    if (index === -1) {
      newEnabledHookScopes.push(enabledHookScope);
    } else {
      alreadyEnabledHookScopes.push(enabledHookScope);
      disabledHookScopes.splice(index, 1);
    }
  });

  return {
    enabledHookScopes,
    newEnabledHookScopes,
    alreadyEnabledHookScopes,
    disabledHookScopes,
  };
}

export async function runLifecycleHook(lifecycleHook: LifecycleHookEnum, activePageScopes: HookScope[], props?: any) {
  const hookPages = getPageConfigs().map((hookPage) => getScopeName({ hookName: hookPage.hookName }));
  // beforeRouting 区别于其他页面生命周期
  // 在路由切换时，RootProduct应当是始终都需要执行的
  if (lifecycleHook === LifecycleHookEnum.beforeRouting) {
    const RootScope = compoundScope();
    activePageScopes.unshift(RootScope);

    const RootScopeName = getScopeName(RootScope);
    hookPages.push(RootScopeName);
  }

  const { enabledHookScopes, newEnabledHookScopes, disabledHookScopes } = matchHooksScopes(activePageScopes);

  const scopeHooksRunners = [];

  disabledHookScopes.forEach(({ pageScope, hookScope }) => {
    const scopeHooks = getScopeHooks(hookScope.scopeName);
    scopeHooks.forEach(({ hookDescEntity, opts }) => {
      // 生命周期钩子函数获取
      const hookDescRunner = hookDescEntity(lifecycleHook);
      if (hookDescRunner && 'clear' in hookDescRunner) {
        scopeHooksRunners.push([hookDescRunner.clear, {
          ...props,
          pageScope,
          hookScope,
          opts,
          matched: false,
          hookPages,
          activePageScopes,
          errorHandler: (error: Event) => {
            return errorHandler(error, [pageScope]);
          },
        }]);
      }
    });
  });

  // 新启用hook，如果有页面，则先卸载页面，更新配置
  if (lifecycleHook === LifecycleHookEnum.beforeRouting) {
    newEnabledHookScopes.forEach(({ hookScope }) => {
      const scopeHooks = getScopeHooks(hookScope.scopeName);
      scopeHooks.forEach(({ hookDescEntity, opts }) => {
        const hookPageConfig = hookDescEntity(LifecycleHookEnum.page) as PageConfig;
        if (hookPageConfig) {
          const hookPageName = getScopeName({ hookName: hookPageConfig.hookName });
          const hookPageScope = getScope(hookPageName);
          // 更新配置
          if (opts?.page && hookPageScope?.page) {
            hookPageScope.page.setConfig(opts.page);
          }
          // 卸载页面
          const hookPageStatus = getAppStatus(hookPageName);
          if (hookPageStatus && [NOT_LOADED, UNLOADING].indexOf(hookPageStatus) === -1) {
            unloadApplication(hookPageName);
          }
        }
      });
    });
  }

  enabledHookScopes.forEach(({ pageScope, hookScope }) => {
    const scopeHooks = getScopeHooks(hookScope.scopeName);
    scopeHooks.forEach(({ hookDescEntity, opts }) => {
      const hookDescRunner = hookDescEntity(lifecycleHook);
      if (hookDescRunner && 'exec' in hookDescRunner) {
        scopeHooksRunners.push([hookDescRunner.exec, {
          ...props,
          pageScope,
          hookScope,
          opts,
          matched: true,
          hookPages,
          activePageScopes,
          errorHandler: (error: Event) => {
            return errorHandler(error, [pageScope]);
          },
        }]);
      }
    });
  });

  const pRunners = scopeHooksRunners.map(([runner, opts]) => {
    return runner(opts);
  });

  const continues = await Promise.all(pRunners);
  if (continues.find((i) => i === false) === false) {
    return false;
  }

  return true;
}
