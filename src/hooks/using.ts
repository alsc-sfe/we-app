import { UsingHooksConfigs, UsingHookOpts, UsingScope, HookDesc, HookOpts } from '@saasfe/we-app-types';
import { getScopeName, ScopeNameDivider } from '@saasfe/we-app-utils';
import { getHookEntity, hasHookName, registerHooks } from './register';

const HooksScopes: UsingScope[] = [];
const ScopesHooks: { [scopeName: string]: { hookName: string; opts?: any }[] } = {};

export function getHooksScopes() {
  return HooksScopes;
}

export function getScopeHookNames(scopeName: string) {
  const scopeHooks = ScopesHooks[scopeName];
  return scopeHooks.map(({ hookName }) => hookName);
}

export function getScopeHooks(scopeName: string) {
  const scopeHooks = ScopesHooks[scopeName];
  return scopeHooks.map(({ hookName, opts }) => {
    const hookEntity = getHookEntity(hookName);
    return {
      ...hookEntity,
      hookName,
      opts: {
        ...hookEntity.opts,
        ...opts,
      },
    };
  });
}

function getEnabledHooks(scopeName: string, traced: boolean = true) {
  let enabledHooks = ScopesHooks[scopeName];
  if (!enabledHooks && traced) {
    const names = scopeName.split(ScopeNameDivider);
    names.pop();

    let name: string;
    if (names.length > 1) {
      name = names.join(ScopeNameDivider);
    } else {
      name = names[1] || '';
    }
    enabledHooks = getEnabledHooks(name);
  }
  return enabledHooks;
}

function setHooksOpts(hooksConfig: UsingHooksConfigs, scope: UsingScope) {
  const scopeName = getScopeName(scope);
  // 检测在当前scope上是否启用扩展
  const enabledHooks = getEnabledHooks(scopeName);
  if (!enabledHooks) {
    throw new Error(`请指定需要启用的扩展，工作范围 ${scopeName}`);
  }
  // 在当前scope上保存扩展配置
  const scopeHooks = ScopesHooks[scopeName];
  hooksConfig.forEach((hookConfig) => {
    let hookName = hookConfig as string;
    let opts: HookOpts;

    if (typeof hookConfig === 'object') {
      hookName = hookConfig.hookName;
      opts = hookConfig.config;
    }

    const scopeHook = scopeHooks.find((h) => h.hookName === hookName);
    if (scopeHook) {
      scopeHook.opts = {
        ...scopeHook.opts,
        ...opts,
      };
    } else {
      scopeHooks.push({ hookName, opts });
    }
  });
}

function enableHooks(hooksConfig: UsingHooksConfigs, scope: UsingScope) {
  let scopeName = scope as string;
  if (typeof scope === 'object') {
    scopeName = getScopeName(scope);
    scope.scopeName = scopeName;
  }

  // 保存启用scope
  const hookScopeIndex = HooksScopes.findIndex((hookScope) => {
    if (typeof hookScope === 'string') {
      return hookScope === scopeName;
    }
    return hookScope.scopeName === scopeName;
  });
  if (hookScopeIndex === -1) {
    HooksScopes.push(scope);
  }

  // 保存scope中启用hook信息
  ScopesHooks[scopeName] = ScopesHooks[scopeName] || [];

  // 设置scope中hook配置
  if (!hooksConfig) {
    ScopesHooks[scopeName] = [];
    return;
  }
  setHooksOpts(hooksConfig, scope);
}

// 可以禁用所有，当前scope enabledHook为[]
// 可以重新指定启用hook，可以自定义hook
export function usingHooks(hookConfigs: UsingHooksConfigs, scopes: UsingScope[]) {
  // 禁用所有
  if (!hookConfigs && scopes) {
    scopes.forEach((scope) => {
      enableHooks(hookConfigs, scope);
    });
    return;
  }

  const configs: UsingHookOpts<any>[] = hookConfigs.map((hookConfig) => {
    if (typeof hookConfig === 'string') {
      return {
        hookName: hookConfig,
        scopes,
      };
    }
    return {
      ...hookConfig,
      scopes: hookConfig.scopes || scopes,
    };
  });

  const needRegisterHooks: [HookDesc<any>, any][] = [];
  const scopeHooksOpts: { [scopeName: string]: UsingHookOpts<any>[] } = {};
  const scopeMap: { [scopeName: string]: UsingScope } = {};
  configs.forEach((usingHookOpts) => {
    const { hookName, hookDesc, config, scopes: hookScopes } = usingHookOpts;
    // 注册hook
    if (hookDesc) {
      if (hasHookName(hookName)) {
        console.warn(`同名扩展 ${hookName} 不可重复注册`);
        return;
      }
      hookDesc.hookName = hookName;
      needRegisterHooks.push([hookDesc, config]);
    }
    // 在scope启用和配置hook
    if (hookScopes) {
      hookScopes.forEach((scope) => {
        const scopeName = getScopeName(scope);
        scopeMap[scopeName] = scope;

        scopeHooksOpts[scopeName] = scopeHooksOpts[scopeName] || [];
        const scopeHookOpts = scopeHooksOpts[scopeName];
        const index = scopeHookOpts.findIndex((scopeUsingHookOpts) => scopeUsingHookOpts.hookName === hookName);
        if (index === -1) {
          scopeHookOpts.push(usingHookOpts);
        }
      });
    }
  });

  // 注册hook
  registerHooks(needRegisterHooks);

  // 启用hook
  Object.keys(scopeHooksOpts).forEach((scopeName) => {
    const scopeHookOpts = scopeHooksOpts[scopeName];
    // 清空当前scope已启用扩展
    ScopesHooks[scopeName] = [];

    enableHooks(scopeHookOpts, scopeMap[scopeName]);
  });
}

export function configHooks(hookConfigs: (UsingHookOpts<any>|string)[], scopes: UsingScope[]) {
  const configs: UsingHookOpts<any>[] = hookConfigs.map((hookConfig) => {
    if (typeof hookConfig === 'string') {
      return {
        hookName: hookConfig,
        scopes,
      };
    }
    return {
      ...hookConfig,
      scopes: hookConfig.scopes || scopes,
    };
  });
  // 根据scope，解析出各个需要配置的hook
  // 前提是，已经指定当前scope需要启用的hook
  const scopeHooksOpts: { [scopeName: string]: UsingHookOpts<any>[] } = {};
  const scopeMap: { [scopeName: string]: UsingScope } = {};
  configs.forEach((usingHookOpts) => {
    const { hookName, scopes: hookScopes } = usingHookOpts;
    if (hookScopes) {
      hookScopes.forEach((scope) => {
        const scopeName = getScopeName(scope);
        scopeMap[scopeName] = scope;

        scopeHooksOpts[scopeName] = scopeHooksOpts[scopeName] || [];
        const scopeHookOpts = scopeHooksOpts[scopeName];
        const index = scopeHookOpts.findIndex((scopeUsingHookOpts) => scopeUsingHookOpts.hookName === hookName);
        if (index === -1) {
          scopeHookOpts.push(usingHookOpts);
        }
      });
    }
  });
  // 设置scope hook opts
  Object.keys(scopeHooksOpts).forEach((scopeName) => {
    const scopeHookOpts = scopeHooksOpts[scopeName];
    enableHooks(scopeHookOpts, scopeMap[scopeName]);
  });
}
