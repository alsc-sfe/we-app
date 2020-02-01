import singleSpa from '../single-spa';
import { getLifecycleHook } from '../hooks';
import { getPageName } from '../helpers';

singleSpa.addErrorHandler(async (error: any) => {
  const hooks = getLifecycleHook('onError');
  const pageName = error.appOrParcelName || error.appName || error.name;

  hooks
    .filter(({ scope, fn }) => {
      return getPageName(scope) === pageName;
    })
    .reduce((p, { fn }) => {
      return p.then(fn);
    }, Promise.resolve())
    .then(() => {
      if (singleSpa.getAppStatus(pageName)) {
        singleSpa.unloadApplication(pageName);
      }
    });

  return Promise.reject(error);
});
