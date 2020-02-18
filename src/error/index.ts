import singleSpa from '../single-spa';
import { runLifecycleHook } from '../hooks';
import rootProduct from '../weapp/root-product';
import { HookScope } from '../hooks/type';

export const errorHandler = (error: Event, activeScopes: HookScope<any>[]) => {
  // 向外抛出错误
  Promise.reject(error);
  // 执行生命周期钩子
  return runLifecycleHook('onError', activeScopes, { error });
};

singleSpa.addErrorHandler((error: any) => {
  const pageName = error.appOrParcelName || error.appName || error.name;
  const activeScope = rootProduct.getScope(pageName);

  errorHandler(error, [activeScope])
    .then(() => {
      if (singleSpa.getAppStatus(pageName)) {
        singleSpa.unloadApplication(pageName);
      }
    });
});
