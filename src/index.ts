import { startRouting } from './routing';
import { ProductConfig } from './weapp/product';
import { registerProducts, registerWeApps, setConfig, startRootProduct, specifyHooks } from './weapp';
import { registerHooks } from './hooks';
import { start as singleSpaStart } from './single-spa';

export async function start(config: ProductConfig) {
  setConfig(config);
  // 首次进入，触发路由拦截
  // 默认执行根scope，而当页面不是在根scope时，怎么办
  await startRouting();
  // 初始化页面
  startRootProduct();
  // singleSpa要求必须调用
  singleSpaStart();
}

export {
  registerHooks,

  registerProducts,
  registerWeApps,
  setConfig,
  specifyHooks,
};
