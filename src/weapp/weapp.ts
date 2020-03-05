import Page, { PageConfig } from './page';
import Product from './product';
import Base, { BaseConfig, BaseType } from './base';
import { getScopeName } from '../helpers';
import { HookScope } from '../hooks/type';

export interface WeAppConfig extends BaseConfig {
  parent?: Product;

  url?: string;
  // 子应用标题
  // 规范：https://yuque.antfin-inc.com/ele-fe/zgm9ar/lmk4t9
  title?: string;
  // 子应用描述
  description?: string;
  // 页面路由前缀，默认为/${name}，可以通过basename覆盖
  basename?: string;

  pages?: PageConfig[];

  filterPages?: (cfgs: PageConfig|PageConfig[]) => PageConfig|PageConfig[]|undefined;

  [prop: string]: any;
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
      this.registerPages(config.pages);
    }
  }

  async registerPages(configs: PageConfig[] = []) {
    const cfgs = this.filterPages(configs) as PageConfig[];
    if (cfgs) {
      const pages = await this.registerChildren(cfgs, Page) as Page[];
      registedPages = registedPages.concat(pages);
      return pages;
    }
  }

  async registerPage(cfg: PageConfig) {
    const config = this.filterPages(cfg) as PageConfig;
    if (config) {
      const page = await this.registerChild(config, Page) as Page;
      page && registedPages.push(page);
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

  protected async registerChild(config: PageConfig, Child: typeof Page) {
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
