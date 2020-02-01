import Page, { PageConfig } from './page';
import Product from './product';

export interface WeAppConfig {
  weAppName: string;
  product: Product;
  pages?: PageConfig[];
}

export default class WeApp {
  weAppName: string;

  product: Product;

  private pages: Page[];

  constructor(config: WeAppConfig) {
    if (config) {
      this.weAppName = config.weAppName;
      this.product = config.product;

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
}
