import Product, { ProductConfig } from './product';
import { BuildinProductName, HookWeAppName, ScopeNameDivider } from '../helpers';
import WeApp, { getActivePageScopes } from './weapp';
import Base, { BaseType } from './base';
import { DefaultResourceLoader } from '../resource-loader';
import { RouterType } from '../routing/enum';
import { HookScope } from '../hooks/type';
import { getPageConfigs } from '../hooks';

class RootProduct extends Product {
  type: BaseType = BaseType.root;

  parent: Product = this;

  registerProducts(cfgs: ProductConfig[] = []) {
    this.setInitDeferred();

    const pProducts = cfgs.map((cfg) => {
      return this.registerProduct(cfg) as Promise<Product>;
    });

    Promise.all(pProducts).then(() => {
      this.setInited();
    });

    return pProducts;
  }

  registerProduct(cfg: ProductConfig) {
    return this.registerChild(cfg, Product) as Promise<Product>;
  }

  getProduct(productName: string) {
    const product = this.getChild(productName) as Product;
    if (product.type !== BaseType.product) {
      return;
    }
    return product;
  }

  getScope(scopeName: string) {
    const scope = this.parseScopeName(scopeName);
    scope.scopeName = scopeName;

    if (scope.hookName) {
      const buildinProduct = this.getProduct(BuildinProductName);
      const hookWeApp = buildinProduct.getWeApp(HookWeAppName);
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

  async registerHookPages() {
    // 注册hook页面
    const pageConfigs = getPageConfigs();
    const hookWeApp = await this.registerHookApp();
    hookWeApp.registerPages(pageConfigs);
  }

  protected async registerHookApp() {
    // 注册内置产品
    const buildinProduct = await this.registerProduct({
      name: BuildinProductName,
    });
    // 注册hook微应用
    const hookWeApp = await buildinProduct.registerWeApp({
      name: HookWeAppName,
    }) as WeApp;

    return hookWeApp;
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
      // 可能是产品、微应用，也可能是微应用、页面
      const name = paths[0];
      const product = this.getProduct(name);
      if (product) {
        scope.productName = name;
        scope.product = product;
        scope.weAppName = paths[1];
      } else {
        scope.weAppName = paths[0];
        scope.pageName = paths[1];
      }
    } else if (pathsLen === 1) {
      // 可能是产品，可能是微应用
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

export const registerWeApps = rootProduct.registerWeApps.bind(rootProduct) as RootProduct['registerWeApps'];

export const usingHooks = rootProduct.usingHooks.bind(rootProduct) as RootProduct['usingHooks'];
export const configHooks = rootProduct.configHooks.bind(rootProduct) as RootProduct['configHooks'];
export const registerHookPages = rootProduct.registerHookPages.bind(rootProduct) as RootProduct['registerHookPages'];

export const startRootProduct = rootProduct.start.bind(rootProduct) as RootProduct['start'];

export const getScope = rootProduct.getScope.bind(rootProduct) as RootProduct['getScope'];
export const setConfig = rootProduct.setConfig.bind(rootProduct) as RootProduct['setConfig'];
export const compoundScope = (base?: Base) => {
  return rootProduct.compoundScope(base || rootProduct);
};
export const requireChildrenInited = rootProduct.requireChildrenInited.bind(rootProduct) as RootProduct['requireChildrenInited'];

export const setData = rootProduct.setData.bind(rootProduct) as RootProduct['setData'];
export const getData = rootProduct.getData.bind(rootProduct) as RootProduct['getData'];

export const setResourceLoader = rootProduct.setResourceLoader.bind(rootProduct) as RootProduct['setResourceLoader'];
export const setPageContainer = rootProduct.setPageContainer.bind(rootProduct) as RootProduct['setPageContainer'];
export const setRender = rootProduct.setRender.bind(rootProduct) as RootProduct['setRender'];

export {
  getActivePageScopes,
};
