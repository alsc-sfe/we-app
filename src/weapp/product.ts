/**
 * 定义产品级别的共用的功能
 * 1. 基础dom结构，每个产品可单独定义
 * 2. 要加载的基础资源，每个产品、微应用可单独定义
 * 3. 页面渲染实现，每个产品、微应用可单独定义
 * 4. 生命周期钩子，每个产品可单独定义，各个钩子根据条件(当前激活的产品、微应用、页面)决定是否被调用
 *    hooks被启用的位置，决定了其判断条件
 */
import WeApp, { WeAppConfig } from './weapp';
import Base, { BaseConfig, BaseType, Render } from './base';
import { ResourceLoader } from '../resource-loader';

export interface ProductConfig extends BaseConfig {
  parent?: Product;
  // 微应用列表
  weApps?: WeAppConfig[];
  // 页面渲染实现
  render?: Render;
  // 资源加载器
  resourceLoader?: ResourceLoader;
}

class Product extends Base {
  type: BaseType = BaseType.product;

  parent: Product;

  constructor(config: ProductConfig) {
    super(config);

    if (config.weApps) {
      this.registerWeApps(config.weApps);
    }
  }

  registerWeApps(cfgs: WeAppConfig[]) {
    return this.registerChildren(cfgs, WeApp) as WeApp[];
  }

  registerWeApp(cfg: WeAppConfig) {
    return this.registerChild(cfg, WeApp) as WeApp;
  }

  getWeApp(weAppName: string) {
    return this.getChild(weAppName) as WeApp;
  }
}

export default Product;
