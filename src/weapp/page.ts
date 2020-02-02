import singleSpa from '../single-spa';
import { getPageName } from '../helpers';
import Base, { BaseConfig, BaseType } from './base';

export interface PageConfig extends BaseConfig {
  activityFunctions?: Function[];
  render?: Function;
  [prop: string]: any;
}

export default class Page extends Base {
  type: BaseType = BaseType.page;

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
}
