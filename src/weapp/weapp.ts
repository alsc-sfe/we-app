import Page, { PageConfig } from './page';
import Product from './product';
import Base, { BaseConfig, BaseType } from './base';
import { checkUseSystem } from '../helpers';
import { ResourceLoader, ResourceFunction } from '../resource-loader';
import { Route as TRoute } from '../routing';
import { HookScope } from '../hooks/type';

export interface WeAppConfig extends BaseConfig {
  parent?: Product;

  url?: string;

  pages?: PageConfig[];

  filterPages?: (cfgs: PageConfig|PageConfig[]) => PageConfig|PageConfig[]|undefined;
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
  getComponent: ResourceFunction;
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
        url: [module.getComponent],
        route: transformRoute(module.route),
        routeIgnore: transformRoute(module.routeIgnore),
      };
    }),
    ...appConfig,
  };
}

// 已注册页面都记录在这里
// 主要用于首次访问时获取activeScopes
let registedPages: Page[] = [];

export default class WeApp extends Base {
  type: BaseType = BaseType.weApp;

  parent: Product;

  constructor(config: WeAppConfig) {
    super(config);

    if (config) {
      if (config.url) {
        this.setInitDeferred();
        this.loadConfig(config).then(() => {
          this.setInited();
        });
      } else {
        this.registerPages(config.pages);
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

    this.registerPages(weAppConfig.pages);
  }

  registerPages(configs: PageConfig[] = []) {
    const cfgs = this.filterPages(configs) as PageConfig[];
    if (cfgs) {
      const pages = this.registerChildren(cfgs, Page) as Page[];
      registedPages = registedPages.concat(pages);
      return pages;
    }
  }

  registerPage(cfg: PageConfig) {
    const config = this.filterPages(cfg) as PageConfig;
    if (config) {
      const page = this.registerChild(config, Page) as Page;
      registedPages.push(page);
      return page;
    }
  }

  filterPages(cfgs: PageConfig|PageConfig[]) {
    const filter = this.getConfig('filterPages') as WeAppConfig['filterPages'];
    if (filter && typeof filter === 'function') {
      return filter(cfgs);
    }
    return cfgs;
  }

  getPage(pageName: string) {
    return this.getChild(pageName) as Page;
  }
}

export function getActiveScopes(location: Location) {
  const activeScopes: HookScope<any>[] = [];
  const activeFns = registedPages.map((page) => {
    return {
      page,
      activeFn: page.makeActivityFunction(),
    };
  });
  activeFns.forEach(({ page, activeFn }) => {
    if (activeFn(location)) {
      activeScopes.push(page.compoundScope(page));
    }
  });
  return activeScopes;
}
