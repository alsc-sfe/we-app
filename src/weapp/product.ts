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
import { AppConfig, transformAppConfig } from './helper';
import { checkUseSystem } from '../helpers';

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
    this.setInitDeferred();
    const pWeApps = this.registerChildren(cfgs, WeApp) as Promise<WeApp[]>;
    pWeApps.then(() => {
      this.setInited();
    });
    return pWeApps;
  }

  registerWeApp(cfg: WeAppConfig) {
    this.setInitDeferred();
    const pWeApp = this.registerChild(cfg, WeApp);
    pWeApp.then(() => {
      this.setInited();
    });
    return pWeApp;
  }

  getWeApp(weAppName: string) {
    return this.getChild(weAppName) as WeApp;
  }

  protected async registerChild(config: AppConfig, Child: typeof WeApp|typeof Product) {
    let childConfig = config;

    if (Child === WeApp && config?.url) {
      childConfig = await this.loadAppConfig(config);
    }

    const child = await super.registerChild({
      ...childConfig,
      type: Child === WeApp ? BaseType.weApp : BaseType.product,
    }, Child) as WeApp|Product;
    return child;
  }

  private async loadAppConfig(config: WeAppConfig) {
    const { url } = config;
    const resourceLoader = this.getConfig('resourceLoader') as ResourceLoader;
    const useSystem = this.getConfig('useSystem') as string[];

    let weAppConfig = await resourceLoader.mount(
      url,
      this.compoundScope(this),
      { useSystem: checkUseSystem(useSystem, 'url') }
    );

    weAppConfig = transformAppConfig(weAppConfig.default || weAppConfig);

    weAppConfig = {
      ...weAppConfig,
      ...config,
    };

    return weAppConfig;
  }
}

export default Product;
