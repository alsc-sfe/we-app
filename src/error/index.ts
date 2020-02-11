import singleSpa from '../single-spa';
import { runHook } from '../hooks/hooks';
import rootProduct from '../weapp/root-product';

singleSpa.addErrorHandler(async (error: any) => {
  const pageName = error.appOrParcelName || error.appName || error.name;
  const activeScope = rootProduct.getScope(pageName);

  await runHook('onError', [activeScope])
    .then(() => {
      if (singleSpa.getAppStatus(pageName)) {
        singleSpa.unloadApplication(pageName);
      }
    });

  return Promise.reject(error);
});
