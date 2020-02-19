import Page, { PageConfig } from './page';
import Product from './product';
import Base, { BaseConfig, BaseType } from './base';
import { checkUseSystem } from '../helpers';
import { ResourceLoader } from '../resource-loader';
import { Route as TRoute } from '../routing';

export interface WeAppConfig extends BaseConfig {
  parent?: Product;

  url?: string;

  pages?: PageConfig[];
}

interface Route {
  pathname: string;
  absolute?: boolean;
  exact?: boolean;
  strict?: boolean;
}
interface Module {
  moduleName: string;
  route: string|string[]|boolean|Route|Route[];
  routeIgnore: Route[];
  getComponent: () => Promise<any>;
  [prop: string]: any;
}
interface AppConfig {
  microAppName: string;
  modules: Module[];
}

function transformRoute(route: string|string[]|boolean|Route|Route[]): TRoute {
  if (['string', 'boolean', 'undefined'].indexOf(typeof route) > -1) {
    return route as string|boolean;
  }
  const routes = Array.isArray(route) ? route : [route];
  return routes.map((r) => {
    if (typeof r === 'string') {
      return r;
    }

    const rt = r as Route;
    return {
      ...rt,
      path: rt.absolute ? `~${rt.pathname}` : rt.pathname,
    };
  });
}

function transformAppConfig(appConfig: AppConfig): WeAppConfig {
  return {
    name: appConfig.microAppName,
    pages: appConfig.modules.map((module): PageConfig => {
      return {
        ...module,
        name: module.moduleName,
        url: [module.getComponent()],
        route: transformRoute(module.route),
        routeIgnore: transformRoute(module.routeIgnore),
      };
    }),
    ...appConfig,
  };
}

export default class WeApp extends Base {
  type: BaseType = BaseType.weApp;

  parent: Product;

  constructor(config: WeAppConfig) {
    super(config);

    if (config) {
      if (config.url) {
        this.loadConfig(config);
      } else {
        this.appendPages(config.pages);
      }
    }
  }

  async loadConfig(config: WeAppConfig) {
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

    this.setConfig(weAppConfig);

    // crm中从三方渠道过来需要去掉navbar，如何实现？
    this.appendPages(weAppConfig.pages);
  }

  appendPages(cfgs: PageConfig[] = []) {
    return cfgs.map((config) => {
      return this.appendPage(config);
    }) as Page[];
  }

  appendPage(config: PageConfig) {
    return this.appendChild(config, Page) as Page;
  }

  getPage(pageName: string) {
    return this.getChild(pageName) as Page;
  }
}
