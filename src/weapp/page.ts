import singleSpa from '../single-spa';
import { getPageName } from '../helpers';
import Base, { BaseConfig, BaseType } from './base';
import { Render } from './product';

export interface PageConfig extends BaseConfig {
  activityFunction?: (location: Location) => boolean;
  render?: Render;
  [prop: string]: any;
}

export default class Page extends Base {
  type: BaseType = BaseType.page;

  private pageContainer: HTMLElement;

  constructor(config: PageConfig) {
    super(config);

    const { name: pageName, parent: weApp } = config;
    const { name: weAppName, parent: product } = weApp;
    const { name: productName } = product;
    const scope = {
      productName,
      weAppName,
      pageName,
    };

    singleSpa.registerApplication(
      getPageName(scope),
      async () => {
        // beforeLoad
        return {
          bootstrap: [],
          mount: [
            async () => {
              // beforeRender
            },
          ],
          unmount: [],
        };
      },
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
