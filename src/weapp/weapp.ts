import get from 'lodash-es/get';
import Page, { PageConfig } from './page';
import Product from './product';
import { DisabledHooks } from '../hooks/hooks';
import Base, { BaseConfig, BaseType } from './base';

export interface WeAppConfig extends BaseConfig {
  parent?: Product;

  pages?: PageConfig[];
}

export default class WeApp extends Base {
  type: BaseType = BaseType.weApp;

  parent: Product;

  constructor(config: WeAppConfig) {
    super(config);

    if (config) {
      this.registerPages(config.pages);
    }
  }

  registerPages(cfgs: PageConfig[] = []) {
    return cfgs.map((config) => {
      return this.registerPage(config);
    }) as Page[];
  }

  registerPage(config: PageConfig) {
    return this.registerChild(config, Page) as Page;
  }

  getPage(pageName: string) {
    return this.getChild(pageName) as Page;
  }
}
