import singleSpa from '../single-spa';
import { getPageName } from '../helpers';
import Base, { BaseConfig, BaseType } from './base';
import { HookScope } from '../hooks/type';
import WeApp from './weapp';
import Product from './product';

export interface PageConfig extends BaseConfig {
  parent?: WeApp;

  activityFunction?: (location: Location) => boolean;

  // 一般为一个js、一个css
  url?: string[]|Promise<any>[];

  [prop: string]: any;
}

export default class Page extends Base {
  type: BaseType = BaseType.page;

  parent: WeApp;

  private pageContainer: HTMLElement;

  constructor(config: PageConfig) {
    super(config);

    const { name: pageName, parent: weApp, resourceLoader, url } = config;
    const { name: weAppName, parent: product } = weApp as WeApp;
    const { name: productName } = product as Product;
    const scope: HookScope<any> = {
      productName,
      weAppName,
      pageName,

      page: this,
      weApp,
      product,
    };

    singleSpa.registerApplication(
      getPageName(scope),
      async () => {
        // beforeLoad
        url.map((r) => {
          return resourceLoader.mount(r);
        });

        return {
          bootstrap: [],
          mount: [
            // beforeMount
            async () => {

            },
            // afterMount
          ],
          unmount: [
            // beforeUnmount
            // afterUnmount
          ],
        };
      },
      // 需要将首页的逻辑放入
      config.activityFunction,
      {
        ...scope,
      },
    );
  }

  getPageContainer() {
    return this.pageContainer;
  }

  setPageContainer(pageContainer: HTMLElement) {
    this.pageContainer = pageContainer;
  }
}
