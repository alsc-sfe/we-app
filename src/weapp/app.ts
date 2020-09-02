import { PageConfig, HookScope, AppConfig, BaseType,
  PageInstance, AppInstance, ProductInstance, PageConstructor } from '@saasfe/we-app-types';
import Base from './base';
import Page from './page';
import { getScopeName } from '@saasfe/we-app-utils';

// 已注册页面都记录在这里
// 主要用于首次访问时获取activeScopes
let registedPages: PageInstance[] = [];

export default class App extends Base implements AppInstance {
  type: BaseType.app = BaseType.app;

  parent: ProductInstance;

  constructor(config: AppConfig) {
    super(config);

    if (config) {
      this.registerPages(config.pages);
    }
  }

  async registerPages(configs: PageConfig[] = []) {
    const cfgs = this.filterPages(configs) as PageConfig[];
    if (cfgs) {
      const pages = await this.registerChildren(cfgs, Page) as PageInstance[];
      registedPages = registedPages.concat(pages);
      return pages;
    }
  }

  async registerPage(cfg: PageConfig) {
    const config = this.filterPages(cfg) as PageConfig;
    if (config) {
      const page = await this.registerChild(config, Page) as PageInstance;
      page && registedPages.push(page);
      return page;
    }
  }

  filterPages(cfgs: PageConfig|PageConfig[]) {
    const filter = this.getConfig('filterPages') as AppConfig['filterPages'];
    if (filter && typeof filter === 'function') {
      return filter(cfgs);
    }
    return cfgs;
  }

  getPage(pageName: string) {
    return this.getChild(pageName) as PageInstance;
  }

  protected async registerChild(config: PageConfig, Child: PageConstructor) {
    return super.registerChild({ ...config, type: BaseType.page }, Child);
  }
}

export function getActivePageScopes(location: Location, excludePageNames: string[] = []) {
  const activeScopes: HookScope[] = [];
  const activeFns = registedPages.filter((page) => {
    const scope = page.compoundScope(page);
    const pageName = getScopeName(scope);
    return excludePageNames.indexOf(pageName) === -1;
  }).map((page) => {
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
