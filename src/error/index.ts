import { addErrorHandler, getAppStatus, unloadApplication } from '../single-spa';
import { runLifecycleHook } from '../hooks';
import { getScope } from '../weapp';
import { HookScope } from '../hooks/type';

export const errorHandler = (error: Event, activeScopes: HookScope<any>[]) => {
  // 向外抛出错误
  Promise.reject(error);
  // 执行生命周期钩子
  return runLifecycleHook('onError', activeScopes, { error });
};

addErrorHandler((error: any) => {
  const pageName = error.appOrParcelName || error.appName || error.name;
  const activeScope = getScope(pageName);

  errorHandler(error, [activeScope])
    .then(() => {
      if (getAppStatus(pageName)) {
        unloadApplication(pageName);
      }
    });
});
