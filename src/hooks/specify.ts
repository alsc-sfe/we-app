import { HookScope, SpecifyHooksConfig, HookConfig, DisabledHooks } from './type';
import { getScopeName } from '../helpers';
import { getRegisteredHooks, getHookEntity } from './register';

const HooksScopes: (HookScope|string)[] = [];
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

function enableHooks(hooksConfig: SpecifyHooksConfig, scope: HookScope|string) {
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
  const enabledHooks = hooksConfig as string[]|[string, any][];

  ScopesHooks[scopeName] = ScopesHooks[scopeName] || [];
  const scopeHooks = ScopesHooks[scopeName];

  enabledHooks.forEach((hookConfig) => {
    let hookName = hookConfig as string;
    let opts;
    if (Array.isArray(hookConfig)) {
      hookName = hookConfig[0];
      opts = hookConfig[1];
    }
    scopeHooks.push({ hookName, opts });
  });
}

function configHooks(config: HookConfig, scope: HookScope|string) {
  const scopeName = typeof scope === 'string' ? scope : getScopeName(scope);
  let enabledHooks = ScopesHooks[scopeName];
  if (!enabledHooks) {
    const hookNames = getRegisteredHooks();
    enableHooks(hookNames, scope);

    enabledHooks = ScopesHooks[scopeName];
  }

  Object.keys(config).forEach((hookName) => {
    const enabledHook = enabledHooks.find((hook) => hookName === hook.hookName);
    if (enabledHook) {
      enabledHook.opts = config[hookName];
    }
  });
}

function disableHooks(disabledHooks: DisabledHooks, scope: HookScope|string) {
  const hookNames = getRegisteredHooks();

  const enabledHooks = hookNames.filter((hookName) => {
    const index = disabledHooks.indexOf(hookName);
    if (index > -1) {
      disabledHooks.splice(index, 1);
      return false;
    }
    return true;
  });

  enableHooks(enabledHooks, scope);
}

export function specifyHooks(hookConfigs: SpecifyHooksConfig, scope: HookScope|string) {
  if (Array.isArray(hookConfigs)) {
    enableHooks(hookConfigs, scope);
  } else {
    if (hookConfigs.config) {
      configHooks(hookConfigs.config, scope);
    }
    if (hookConfigs.disabled) {
      disableHooks(hookConfigs.disabled, scope);
    }
  }
}
