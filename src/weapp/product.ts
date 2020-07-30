/**
 * 定义产品级别的共用的功能
 * 1. 基础dom结构，每个产品可单独定义
 * 2. 要加载的基础资源，每个产品、微应用可单独定义
 * 3. 页面渲染实现，每个产品、微应用可单独定义
 * 4. 生命周期钩子，每个产品可单独定义，各个钩子根据条件(当前激活的产品、微应用、页面)决定是否被调用
 *    hooks被启用的位置，决定了其判断条件
 */
import App from './app';
import Base from './base';
import { AppConfig, BaseType, ProductInstance, ProductConfig, Parser, AppListParser, AppConfigParser, AppInstance } from '@saasfe/we-app-types';
import { transformAppConfig } from './helper';
import { getContext } from '../context';
import { resourcePreloader, ResourcePreloader } from '@saasfe/we-app-utils';

export default class Product extends Base implements ProductInstance {
  type: BaseType.product|BaseType.root = BaseType.product;

  parent: ProductInstance;

  constructor(config: ProductConfig) {
    super(config);

    if (config.apps) {
      this.registerApps(config.apps);
    }
  }

  async registerApps(cfgs: string|AppConfig[]|any, parser?: Parser|AppListParser) {
    this.setInitDeferred();

    let appConfigs = cfgs as AppConfig[];

    const appListParser = (parser as Parser)?.appListParser || parser as AppListParser;
    appConfigs = await this.parseAppConfigs(cfgs, appListParser);

    const pApps = appConfigs.map((cfg) => {
      return this.registerApp(cfg, (parser as Parser)?.appConfigParser) as Promise<App>;
    });

    const apps = await Promise.all(pApps);

    this.setInited();

    return apps;
  }

  getApp(appName: string) {
    const app = this.getChild(appName) as AppInstance;
    if (!app || app.type !== BaseType.app) {
      return;
    }
    return app;
  }

  async registerApp(config: AppConfig, parser?: AppConfigParser) {
    let childConfig = config;

    childConfig = await this.parseAppConfig(config, parser);

    const child = await this.registerChild(childConfig, App) as AppInstance;

    return child;
  }

  private async parseAppConfigs(url: string|AppConfig[]|any, parser?: AppListParser) {
    let appConfigs: AppConfig[] = url;

    if (typeof parser === 'function') {
      const { desc: resourceLoader, config: resourceLoaderOpts } = this.getResourceLoader();
      appConfigs = await parser(url, {
        context: getContext(),
        resourceLoader: (resource: string, opts: any): Promise<AppConfig[]> => {
          return resourceLoader?.mount(
            resource,
            this.compoundScope(this),
            {
              ...resourceLoaderOpts,
              ...opts,
            }
          );
        },
      });
    }

    // 预加载 app config
    appConfigs.forEach(({ url: resource }) => {
      resourcePreloader(resource, ResourcePreloader.preload);
    });

    return appConfigs;
  }

  private async parseAppConfig(config: AppConfig, parser: AppConfigParser = transformAppConfig) {
    let appConfig = config;

    if (typeof parser === 'function') {
      const { desc: resourceLoader, config: resourceLoaderOpts } = this.getResourceLoader();
      appConfig = await parser(config, {
        context: getContext(),
        resourceLoader: (url: string, opts?: any): Promise<AppConfig> => {
          return resourceLoader?.mount(
            url,
            this.compoundScope(this),
            {
              ...resourceLoaderOpts,
              ...opts,
            }
          );
        },
      });
    }

    appConfig = {
      ...appConfig,
      ...config,
    };

    return appConfig;
  }
}
