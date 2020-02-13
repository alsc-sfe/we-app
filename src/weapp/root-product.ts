import Product, { ProductConfig } from './product';
import { InnerProductName, HookWeAppName, parsePageName } from '../helpers';
import { Hook, HookScope } from '../hooks/type';
import WeApp from './weapp';
import { BaseType } from './base';
import { specifyHooks } from '../hooks';

class RootProduct extends Product {
  type: BaseType = BaseType.root;

  hookWeApp: WeApp;

  registerProducts(cfgs: ProductConfig[] = []) {
    return cfgs.map(config => {
      return this.registerProduct(config);
    }) as Product[];
  }

  registerProduct(config: ProductConfig) {
    return this.registerChild(config, Product) as Product;
  }

  getProduct(productName: string) {
    return this.getChild(productName) as Product;
  }

  setHomePage(opts: HookScope) {}

  registerHook(hook: Hook<any>) {}

  registerHooks(hooks: Hook<any>[]) {

  }

  getScope(pageName: string) {
    const scope = parsePageName(pageName);
    if (scope.hookName) {
      scope.page = this.hookWeApp.getPage(scope.hookName);
    } else if (scope.pageName) {
      if (!scope.productName) {
        scope.weApp = this.getWeApp(scope.weAppName);
        scope.page = scope.weApp.getPage(scope.pageName);
      } else {
        scope.product = this.getProduct(scope.productName);
        scope.weApp = scope.product.getWeApp(scope.weAppName);
        scope.page = scope.weApp.getPage(scope.pageName);
      }
    }
    return scope;
  }

  start() {
    specifyHooks([''], {
      product: this,
    });
  }
}

const rootProduct = new RootProduct();
// 注册内置子产品
const innerProduct = rootProduct.registerProduct({
  name: InnerProductName,
});
const hookWeApp = innerProduct.registerWeApp({
  name: HookWeAppName,
});

rootProduct.hookWeApp = hookWeApp;

export default rootProduct;

export {
  innerProduct,
  hookWeApp,
};
