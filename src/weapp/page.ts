import singleSpa from '../single-spa';
import WeApp from './weapp';
import { getPageName } from '../helpers';

export interface PageConfig {
  pageName: string;
  weApp: WeApp;
  [prop: string]: any;
}

export default class Page {
  pageName: string;

  weApp: WeApp;

  constructor(config: PageConfig) {
    const { pageName, weApp } = config;
    const { weAppName, product } = weApp;
    const { productName } = product;
    const scope = {
      productName,
      weAppName,
      pageName,
    };

    this.pageName = pageName;
    this.weApp = weApp;

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

  getStatus() {
    return '';
  }
}
