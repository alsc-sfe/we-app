import { HookDescRunnerParam, HookScope, LifecycleHookEnum } from './type';
import { getHooksScopes, getScopeHooks, getScopeHookNames } from './specify';
import { getScopeName } from '../helpers';
import { BaseType } from '../weapp/base';
import { getPageConfigs } from './register';
import { errorHandler } from '../error';

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
  const matchedHooksScopes = hooksScopes.filter((hookScope) => {
    const matched = activeScopeNames.indexOf(hookScope.scopeName) > -1;
    if (matched) {
      return true;
    }

    return hookScope.product.type === BaseType.root;
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
  // 计算禁用hookScopes
  // 找到上一个scope在当前scope中不存在的
  const disabledHookScopes = lastEnabledHookScopes.filter(({ hookScope: lastHookScope }) => {
    return enabledHookScopes.findIndex(({ hookScope }) => {
      return lastHookScope.scopeName !== hookScope.scopeName;
    }) > -1;
  });

  return {
    enabledHookScopes,
    disabledHookScopes,
  };
}

export async function runLifecycleHook(lifecycleHook: LifecycleHookEnum, activePageScopes: HookScope[], props?: any) {
  const { enabledHookScopes, disabledHookScopes } = matchHooksScopes(activePageScopes);

  const scopeHooksRunners = [];

  disabledHookScopes.forEach(({ pageScope, hookScope }) => {
    const scopeHooks = getScopeHooks(hookScope.scopeName);
    scopeHooks.forEach(({ hookDescEntity, opts }) => {
      const hookDescRunner = hookDescEntity(lifecycleHook);
      if (hookDescRunner && 'clear' in hookDescRunner) {
        scopeHooksRunners.push([hookDescRunner.clear, {
          ...props,
          pageScope,
          hookScope,
          opts,
          matched: false,
          hookPages: getPageConfigs().map((hookPage) => getScopeName({ hookName: hookPage.hookName })),
          activePageScopes,
          errorHandler: (error: Event) => {
            return errorHandler(error, [pageScope]);
          },
        }]);
      }
    });
  });

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
          hookPages: getPageConfigs().map((hookPage) => getScopeName({ hookName: hookPage.hookName })),
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
  return continues;
}
