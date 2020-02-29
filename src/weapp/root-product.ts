import Product, { ProductConfig } from './product';
import { InnerProductName, HookWeAppName, ScopeNameDivider } from '../helpers';
import WeApp, { getActiveScopes } from './weapp';
import Base, { BaseType } from './base';
import { DefaultResourceLoader } from '../resource-loader';
import { RouterType } from '../routing/enum';
import { UseHooksParams } from '../hooks';
import { HookScope } from '../hooks/type';

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
    const scope = this.parseScopeName(pageName);
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

  private parseScopeName(scopeName: string) {
    const scope: HookScope<any> = {};
    const paths = scopeName.split(ScopeNameDivider);
    const pathsLen = paths.length;
    if (pathsLen === 3) {
      scope.productName = paths[0];
      scope.weAppName = paths[1];
      scope.pageName = paths[2];

      if (paths[1] === HookWeAppName) {
        scope.hookName = paths[1];
      }
    } else if (pathsLen === 2) {
      scope.weAppName = paths[0];
      scope.pageName = paths[1];
    } else if (pathsLen === 1) {
      const name = paths[0];
      const product = this.getProduct(name);
      if (product) {
        scope.productName = name;
        scope.product = product;
      } else {
        const weApp = this.getWeApp(name);
        if (weApp) {
          scope.weAppName = name;
          scope.weApp = weApp;
        }
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
