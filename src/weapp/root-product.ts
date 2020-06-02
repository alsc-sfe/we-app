import Product, { ProductConfig } from './product';
import { BuildinProductName, HookAppName, ScopeNameDivider } from '../utils/helpers';
import App, { getActivePageScopes } from './app';
import Base, { BaseType } from './base';
import { DefaultResourceLoader } from '../resource-loader';
import { RouterType } from '../routing/enum';
import { HookScope } from '../hooks/type';
import { getPageConfigs } from '../hooks';
import { DataName } from '../const';

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
    if (!product || product.type !== BaseType.product) {
      return;
    }
    return product;
  }

  getScope(scopeName: string) {
    const scope = this.parseScopeName(scopeName);
    if (!scope) {
      return;
    }

    if (scope.hookName) {
      const buildinProduct = this.getProduct(BuildinProductName);
      const hookApp = buildinProduct.getApp(HookAppName);
      scope.product = buildinProduct;
      scope.app = hookApp;
      scope.page = hookApp.getPage(scope.hookName);
    } else if (scope.pageName) {
      if (!scope.productName) {
        scope.product = this;
        scope.app = this.getApp(scope.appName);
        scope.page = scope.app.getPage(scope.pageName);
      } else {
        scope.product = this.getProduct(scope.productName);
        scope.app = scope.product.getApp(scope.appName);
        scope.page = scope.app.getPage(scope.pageName);
      }
    }

    return scope;
  }

  async registerHookPages() {
    // 注册hook页面
    const pageConfigs = getPageConfigs();
    const hookApp = await this.registerHookApp();
    hookApp.registerPages(pageConfigs);
  }

  protected async registerHookApp() {
    // 注册内置产品
    const buildinProduct = await this.registerProduct({
      name: BuildinProductName,
    });
    // 注册hook微应用
    const hookApp = await buildinProduct.registerApp({
      name: HookAppName,
    }) as App;

    return hookApp;
  }

  private parseScopeName(scopeName: string) {
    const scope: HookScope = {
      scopeName,
    };

    const paths = scopeName.split(ScopeNameDivider);
    const pathsLen = paths.length;
    if (pathsLen === 3) {
      scope.productName = paths[0];
      scope.appName = paths[1];
      scope.pageName = paths[2];

      if (paths[1] === HookAppName) {
        scope.hookName = paths[2];
      }
    } else if (pathsLen === 2) {
      // 可能是产品、微应用，也可能是微应用、页面
      const name = paths[0];
      const child = this.getChild(name);
      if (child) {
        if (child.type === BaseType.product) {
          scope.productName = name;
          scope.product = child as Product;
          scope.appName = paths[1];
        } else {
          scope.appName = paths[0];
          scope.app = child as App;
          scope.pageName = paths[1];
        }
      }
    } else if (pathsLen === 1) {
      // 可能是产品，可能是微应用
      const name = paths[0];
      const child = this.getChild(name);
      if (child) {
        if (child.type === BaseType.product) {
          scope.productName = name;
          scope.product = child as Product;
        } else {
          scope.appName = name;
          scope.app = child as App;
        }
      }
    }

    if (Object.keys(scope).length === 1) {
      return;
    }

    return scope;
  }
}

const rootProduct = new RootProduct({
  resourceLoader: DefaultResourceLoader,
  routerType: RouterType.browser,
});

export const registerApps = rootProduct.registerApps.bind(rootProduct) as RootProduct['registerApps'];

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
export const setRouterType = (routerType: RouterType) => {
  setData(DataName.routerType, routerType);
};
export const setBasename = (basename: string) => {
  setData(DataName.basename, basename);
};

export {
  getActivePageScopes,
};
