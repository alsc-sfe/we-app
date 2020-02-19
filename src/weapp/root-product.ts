import Product, { ProductConfig } from './product';
import { InnerProductName, HookWeAppName, parsePageName } from '../helpers';
import WeApp, { WeAppConfig } from './weapp';
import Base, { BaseType, BaseConfig } from './base';
import { DefaultResourceLoader } from '../resource-loader';
import { RouterType } from '../routing/enum';

class RootProduct extends Product {
  type: BaseType = BaseType.root;

  parent: Product = this;

  hookWeApp: WeApp;

  private baseConfigs: BaseConfig[] = [];

  registerProducts(cfgs: ProductConfig[] = []) {
    this.baseConfigs = this.baseConfigs.concat(cfgs.map((cfg) => ({
      ...cfg,
      type: BaseType.product,
    })));
  }

  registerWeApps(cfgs: WeAppConfig[] = []) {
    this.baseConfigs = this.baseConfigs.concat(cfgs.map((cfg) => ({
      ...cfg,
      type: BaseType.weApp,
    })));
  }

  appendProduct(config: ProductConfig) {
    return this.appendChild(config, Product) as Product;
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

  startRootProduct() {
    this.baseConfigs.forEach((cfg) => {
      switch (cfg.type) {
        case BaseType.product:
          this.appendProduct(cfg as ProductConfig);
          break;
        case BaseType.weApp:
          this.appendWeApp(cfg as WeAppConfig);
          break;
        default:
          break;
      }
    });
  }
}

const rootProduct = new RootProduct();
// 注册内置子产品，用于挂载hook等微应用
const innerProduct = rootProduct.appendProduct({
  name: InnerProductName,
});
const hookWeApp = innerProduct.appendWeApp({
  name: HookWeAppName,
});

rootProduct.hookWeApp = hookWeApp;

export const registerProducts = rootProduct.registerProducts.bind(rootProduct) as RootProduct['registerProducts'];
export const registerWeApps = rootProduct.registerWeApps.bind(rootProduct) as RootProduct['registerWeApps'];
export const specifyHooks = rootProduct.specifyHooks.bind(rootProduct) as RootProduct['specifyHooks'];
export const startRootProduct = rootProduct.startRootProduct.bind(rootProduct) as RootProduct['startRootProduct'];
export const getScope = rootProduct.getScope.bind(rootProduct) as RootProduct['getScope'];
export const setConfig = (config: ProductConfig) => {
  rootProduct.setConfig({
    resourceLoader: DefaultResourceLoader,
    routerType: RouterType.browser,
    ...config,
  });
};
export const compoundScope = (base?: Base) => {
  return rootProduct.compoundScope(base || rootProduct);
};

export {
  innerProduct,
  hookWeApp,
};
