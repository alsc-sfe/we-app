/**
 * 定义产品级别的共用的功能
 * 1. 基础dom结构，每个产品可单独定义
 * 2. 要加载的基础资源，每个产品、微应用可单独定义
 * 3. 页面渲染实现，每个产品、微应用可单独定义
 * 4. 生命周期钩子，每个产品可单独定义，各个钩子根据条件(当前激活的产品、微应用、页面)决定是否被调用
 *    hooks被启用的位置，决定了其判断条件
 */
import WeApp, { WeAppConfig } from './weapp';
import Base, { BaseConfig, BaseType } from './base';
import { ResourceLoader } from '../resource-loader';
import { transformAppConfig } from './helper';

export interface ProductConfig extends BaseConfig {
  parent?: Product;
  // 微应用列表
  url?: string; // 支持远程获取
  weApps?: WeAppConfig[];
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

    const pWeApps = cfgs.map((cfg) => {
      return this.registerWeApp(cfg) as Promise<WeApp>;
    });

    Promise.all(pWeApps).then(() => {
      this.setInited();
    });

    return pWeApps;
  }

  async registerWeApp(config: WeAppConfig) {
    this.setInitDeferred();

    let childConfig = config;
    if (config?.url) {
      childConfig = await this.loadAppConfig(config);
    }
    const child = await this.registerChild(childConfig, WeApp);

    this.setInited();

    return child;
  }

  getWeApp(weAppName: string) {
    const weApp = this.getChild(weAppName) as WeApp;
    if (weApp.type !== BaseType.weApp) {
      return;
    }
    return weApp;
  }

  private async loadAppConfig(config: WeAppConfig) {
    const { url } = config;
    const { desc: resourceLoader, config: resourceLoaderOpts } = this.getConfig('resourceLoader') as ResourceLoader;

    let weAppConfig = await resourceLoader.mount(
      url,
      this.compoundScope(this),
      resourceLoaderOpts
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
