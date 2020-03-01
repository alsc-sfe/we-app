import { LifecycleHookEnum, HookDescEntity, HookDesc } from './type';
import { PageConfig } from '../weapp/page';
import { getEnabledHookNames } from './xecute';

const HookNames: string[] = [];
const HookEntities: {
  [hookName: string]: {
    hookDescEntity: HookDescEntity<any>;
    opts: any;
  };
} = {};

export function getRegisteredHooks() {
  return HookNames;
}

export function getHookEntity(hookName: string) {
  return HookEntities[hookName];
}

export function getPageConfigs() {
  const pageConfigs: PageConfig[] = [];

  Object.keys(HookEntities).forEach((hookName) => {
    const pageConfig = HookEntities[hookName].hookDescEntity(LifecycleHookEnum.page) as PageConfig;
    if (!pageConfig) {
      return;
    }

    const { activityFunction } = pageConfig;

    const scopeActivityFunction = (location: Location) => {
      // 判断当前启用的插件里是否存在当前插件
      const enabledHookNames = getEnabledHookNames();
      // 匹配启用scope和禁用scope
      const isScopeMatched = enabledHookNames.indexOf(hookName) > -1;

      if (!isScopeMatched) {
        return false;
      }

      return activityFunction(location);
    };

    const pgConfig = {
      ...pageConfig,
      hookName,
      name: hookName,
      activityFunction: scopeActivityFunction,
    };
    pageConfigs.push(pgConfig);
  });

  return pageConfigs;
}

export function registerHook(hookDesc: HookDesc<any>, opts?: any) {
  const { hookName } = hookDesc;
  let hookEntity = HookEntities[hookName];

  if (hookEntity) {
    return hookEntity;
  }

  HookNames.push(hookName);

  hookEntity = {
    hookDescEntity: (lifecycleHook: LifecycleHookEnum) => {
      const lifecycleHookEntity = hookDesc[lifecycleHook];
      if (typeof lifecycleHookEntity === 'function') {
        return {
          exec: lifecycleHookEntity,
        };
      }
      return lifecycleHookEntity;
    },
    opts,
  };

  HookEntities[hookName] = hookEntity;

  return HookEntities[hookName];
}

export function registerHooks(hookDesc: HookDesc<any>|HookDesc<any>[]|[HookDesc<any>, any][], opts?: any) {
  const hookDescs: HookDesc<any>[]|[HookDesc<any>, any][] = Array.isArray(hookDesc) ? hookDesc : [[hookDesc, opts]];

  hookDescs.forEach((h) => {
    if (Array.isArray(h)) {
      registerHook(h[0], h[1]);
    } else {
      registerHook(h);
    }
  });
}
