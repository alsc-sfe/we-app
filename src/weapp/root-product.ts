import Product, { ProductConfig } from './product';
import { InnerProductName, HookWeAppName, ScopeNameDivider } from '../helpers';
import WeApp, { getActivePageScopes } from './weapp';
import Base, { BaseType } from './base';
import { DefaultResourceLoader } from '../resource-loader';
import { RouterType } from '../routing/enum';
import { getPageConfigs } from '../hooks';
import { HookScope } from '../hooks/type';

class RootProduct extends Product {
  type: BaseType = BaseType.root;

  parent: Product = this;

  registerProducts(cfgs: ProductConfig[] = []) {
    return this.registerChildren(cfgs, Product) as Promise<Product[]>;
  }

  registerProduct(cfg: ProductConfig) {
    return this.registerChild(cfg, Product) as Promise<Product>;
  }

  getProduct(productName: string) {
    return this.getChild(productName) as Product;
  }

  getScope(pageName: string) {
    const scope = this.parseScopeName(pageName);
    if (scope.hookName) {
      const innerProduct = this.getProduct(InnerProductName);
      const hookWeApp = innerProduct.getWeApp(HookWeAppName);
      scope.page = hookWeApp.getPage(scope.hookName);
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

  async start() {
    // 注册内置产品
    const innerProduct = await this.registerProduct({
      name: InnerProductName,
    });
    // 注册hook微应用
    const hookWeApp = await innerProduct.registerWeApp({
      name: HookWeAppName,
    }) as WeApp;
    // 注册hook页面
    const pageConfigs = getPageConfigs();
    hookWeApp.registerPages(pageConfigs);

    super.start();
  }

  private parseScopeName(scopeName: string) {
    const scope: HookScope = {};
    const paths = scopeName.split(ScopeNameDivider);
    const pathsLen = paths.length;
    if (pathsLen === 3) {
      scope.productName = paths[0];
      scope.weAppName = paths[1];
      scope.pageName = paths[2];

      if (paths[1] === HookWeAppName) {
        scope.hookName = paths[2];
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
  getActivePageScopes,
};
