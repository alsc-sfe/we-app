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
import { getContext } from '../context';

export interface ProductConfig extends BaseConfig {
  parent?: Product;
  // 微应用列表
  url?: string; // 支持远程获取
  weApps?: WeAppConfig[];
}

export type WeAppListParser = (weAppList: any, opts?: { context: any; [props: string]: any }) => Promise<WeAppConfig[]>;
export type WeAppConfigParser = (weAppConfig: any, opts?: { context: any; [props: string]: any }) => Promise<WeAppConfig>;

export interface Parser {
  appListParser: WeAppListParser;
  appConfigParser: WeAppConfigParser;
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

  async registerWeApps(cfgs: string|WeAppConfig[], parser?: Parser) {
    this.setInitDeferred();

    let weAppConfigs = cfgs as WeAppConfig[];

    if (typeof cfgs === 'string') {
      weAppConfigs = await this.loadWeAppConfigs(cfgs, parser?.appListParser);
    }

    const pWeApps = weAppConfigs.map((cfg) => {
      return this.registerWeApp(cfg, parser?.appConfigParser) as Promise<WeApp>;
    });

    const weApps = await Promise.all(pWeApps);

    this.setInited();

    return weApps;
  }

  getWeApp(weAppName: string) {
    const weApp = this.getChild(weAppName) as WeApp;
    if (weApp.type !== BaseType.weApp) {
      return;
    }
    return weApp;
  }

  async registerWeApp(config: WeAppConfig, parser?: WeAppConfigParser) {
    let childConfig = config;
    if (config?.url) {
      childConfig = await this.loadWeAppConfig(config, parser);
    }
    const child = await this.registerChild(childConfig, WeApp);

    return child;
  }

  private async loadWeAppConfigs(url: string, parser?: WeAppListParser) {
    const { desc: resourceLoader, config: resourceLoaderOpts } = this.getConfig('resourceLoader') as ResourceLoader;
    const weAppList = await resourceLoader.mount(
      url,
      this.compoundScope(this),
      resourceLoaderOpts
    );
    let weAppConfigs = weAppList as WeAppConfig[];
    if (typeof parser === 'function') {
      weAppConfigs = await parser(weAppList, {
        context: getContext(),
      });
    }
    return weAppConfigs;
  }

  private async loadWeAppConfig(config: WeAppConfig, parser: WeAppConfigParser = transformAppConfig) {
    const { url } = config;
    const { desc: resourceLoader, config: resourceLoaderOpts } = this.getConfig('resourceLoader') as ResourceLoader;

    let weAppConfig = await resourceLoader.mount(
      url,
      this.compoundScope(this),
      resourceLoaderOpts
    );

    weAppConfig = await parser(weAppConfig.default || weAppConfig);

    weAppConfig = {
      ...weAppConfig,
      ...config,
    };

    return weAppConfig;
  }
}

export default Product;
