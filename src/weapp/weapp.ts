import get from 'lodash-es/get';
import Page, { PageConfig } from './page';
import Product from './product';

export interface WeAppConfig {
  weAppName: string;
  product?: Product;
  pages?: PageConfig[];
  disabledHooks?: boolean|string[];
}

export default class WeApp {
  weAppName: string;

  product: Product;

  private pages: Page[];

  private config: WeAppConfig;

  private disabledHooks: boolean|string[];

  constructor(config: WeAppConfig) {
    if (config) {
      this.weAppName = config.weAppName;
      this.product = config.product;
      this.disabledHooks = config.disabledHooks;

      this.config = config;

      this.registerPages(config.pages);
    }
  }

  registerPages(cfgs: PageConfig[] = []) {
    cfgs.forEach((config) => {
      this.registerPage(config);
    });
  }

  registerPage(config: PageConfig) {
    const page = new Page({
      ...config,
      weApp: this,
    });

    this.pages.push(page);

    return page;
  }

  getStatus() {
    return '';
  }

  getConfig(pathname?: string) {
    return get(this.config, pathname);
  }
}
