import { LifecycleHookEnum, HookDescEntity, HookDesc } from './type';
import { PageConfig } from '../weapp/page';
import { getEnabledHookNames } from './execute';

const HookNames: string[] = [];
const HookEntities: {
  [hookName: string]: {
    hookDescEntity: HookDescEntity<any>;
    opts: any;
  };
} = {};

export function hasHookName(hookName: string) {
  return HookNames.indexOf(hookName) > -1;
}

export function getRegisteredHooks() {
  return HookNames;
}

export function getHookEntity(hookName: string) {
  return HookEntities[hookName];
}

export function getPageConfigs() {
  const pageConfigs: PageConfig[] = [];

  Object.keys(HookEntities).forEach((hookName) => {
    const hookEntity = HookEntities[hookName];
    const pageConfig = hookEntity?.hookDescEntity(LifecycleHookEnum.page) as PageConfig;
    if (!pageConfig) {
      return;
    }
    pageConfigs.push(pageConfig);
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

      if (!lifecycleHookEntity) {
        return;
      }

      if (typeof lifecycleHookEntity === 'function') {
        return {
          exec: lifecycleHookEntity,
        };
      }

      if (lifecycleHook === LifecycleHookEnum.page) {
        const { activityFunction } = lifecycleHookEntity as PageConfig;

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

        const pageConfig: PageConfig = {
          ...lifecycleHookEntity,
          ...opts?.page,
          hookName,
          name: hookName,
          activityFunction: scopeActivityFunction,
        };

        return pageConfig;
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
