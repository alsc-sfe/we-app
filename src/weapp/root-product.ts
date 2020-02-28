import Product, { ProductConfig } from './product';
import { InnerProductName, HookWeAppName, parsePageName } from '../helpers';
import WeApp, { getActiveScopes } from './weapp';
import Base, { BaseType } from './base';
import { DefaultResourceLoader } from '../resource-loader';
import { RouterType } from '../routing/enum';

class RootProduct extends Product {
  type: BaseType = BaseType.root;

  parent: Product = this;

  hookWeApp: WeApp;

  registerProducts(cfgs: ProductConfig[] = []) {
    return this.registerChildren(cfgs, Product) as Product[];
  }

  registerProduct(cfg: ProductConfig) {
    return this.registerChild(cfg, Product) as Product;
  }

  getProduct(productName: string) {
    return this.getChild(productName) as Product;
  }

  getScope(pageName: string) {
    const scope = parsePageName(pageName);
    if (scope.hookName) {
      scope.page = this.hookWeApp.getPage(scope.hookName);
    } else if (scope.pageName) {
      if (!scope.productName) {
        scope.product = this;
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
}

const rootProduct = new RootProduct({
  resourceLoader: DefaultResourceLoader,
  routerType: RouterType.browser,
});
// 注册内置子产品，用于挂载hook等微应用
const innerProduct = rootProduct.registerProduct({
  name: InnerProductName,
});
const hookWeApp = innerProduct.registerWeApp({
  name: HookWeAppName,
});

rootProduct.hookWeApp = hookWeApp;

export const registerProducts = rootProduct.registerProducts.bind(rootProduct) as RootProduct['registerProducts'];
export const registerWeApps = rootProduct.registerWeApps.bind(rootProduct) as RootProduct['registerWeApps'];
export const specifyHooks = rootProduct.specifyHooks.bind(rootProduct) as RootProduct['specifyHooks'];
export const startRootProduct = rootProduct.start.bind(rootProduct) as RootProduct['start'];
export const getScope = rootProduct.getScope.bind(rootProduct) as RootProduct['getScope'];
export const setConfig = rootProduct.setConfig.bind(rootProduct) as RootProduct['setConfig'];
export const compoundScope = (base?: Base) => {
  return rootProduct.compoundScope(base || rootProduct);
};
export const requireChildrenInited = rootProduct.requireChildrenInited.bind(rootProduct) as RootProduct['requireChildrenInited'];
export const setData = rootProduct.setData.bind(rootProduct) as RootProduct['setData'];
export const getData = rootProduct.getData.bind(rootProduct) as RootProduct['getData'];

export {
  innerProduct,
  hookWeApp,
  getActiveScopes,
};
