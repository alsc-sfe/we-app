import { registerApplication } from 'single-spa';
import { getPageName, checkUseSystem } from '../helpers';
import Base, { BaseConfig, BaseType } from './base';
import { HookScope } from '../hooks/type';
import WeApp from './weapp';
import { Resource } from '../resource-loader';
import { runLifecycleHook } from '../hooks';
import { DEFAULTRouteMatch as routeMatchFn, Route } from '../routing';
import { ajustPathname } from '../routing/util';
import { matchHomepage } from './homepage';

export interface PageConfig extends BaseConfig {
  parent?: WeApp;

  // 路由的定义，始终显示 true, 微应用内相对路径 /page, 绝对路径 ~/product/weapp/page
  route?: Route;
  routeIgnore?: Route;

  // 一般为一个js、一个css
  url?: Resource[];

  [prop: string]: any;
}

export default class Page extends Base {
  type: BaseType = BaseType.page;

  parent: WeApp;

  private pageContainer: HTMLElement;

  constructor(config: PageConfig) {
    super(config);

    const resourceLoader = this.getConfig('resourceLoader');
    const url = this.getConfig('url') || [];
    const useSystem = this.getConfig('useSystem') || [];

    const scope: HookScope<any> = this.compoundScope(this);

    const urlUseSystem = checkUseSystem(useSystem, 'url');

    registerApplication(
      getPageName(scope),
      async (appProps: object) => {
        // beforeLoad
        await runLifecycleHook('beforeLoad', [scope]);

        const mountedUrl = url.map((r) => {
          return resourceLoader.mount(r, scope, { useSystem: urlUseSystem });
        });
        // 获取第一个不为空的返回值
        const component = await Promise.all(mountedUrl).then((resources) => {
          const resource = resources.find((r) => r);
          return resource;
        }).then((resource: any) => resource?.default || resource);

        return {
          bootstrap: [async () => component],
          mount: [
            // beforeMount
            async (customProps: object) => {
              const container = this.getPageContainer();
              const isContinues = await runLifecycleHook('beforeMount', [scope], {
                render: (element) => {
                  this.getRender().mount(element, container, customProps);
                },
              });
              if (isContinues.find((i) => i === false) === false) {
                return;
              }

              this.getRender().mount(component, container, customProps);
            },
            // afterMount
            async () => {
              await runLifecycleHook('afterMount', [scope]);
            },
          ],
          unmount: [
            // beforeUnmount
            async (customProps) => {
              const isContinues = await runLifecycleHook('beforeUnmount', [scope]);
              if (isContinues.find((i) => i === false) === false) {
                return;
              }

              const container = this.getPageContainer();
              this.getRender().unmount(component, container, customProps);
            },
            // afterUnmount
            async () => {
              await runLifecycleHook('afterUnmount', [scope]);
            },
          ],
        };
      },
      this.makeActivityFunction(),
      {
        ...scope,
        basename: this.getBasename(),
        routerType: this.getConfig('routerType'),
      },
    );
  }

  getBasename() {
    const scope = this.compoundScope(this);
    const { productName = '', weAppName = '' } = scope;
    return ajustPathname(`/${productName}/${weAppName}`);
  }

  makeActivityFunction() {
    const config = this.getConfig();
    const { route, routeIgnore, afterRouteDiscover } = config;

    let activityFunction: (location: Location) => boolean;

    if (route === true && !routeIgnore) {
      activityFunction = () => {
        afterRouteDiscover && afterRouteDiscover(true);
        return true;
      };
    } else {
      activityFunction = (location: Location) => {
        // 匹配首页
        let match = location.pathname === '/' &&
          matchHomepage(this.compoundScope(this));
        // 匹配页面路由
        if (!match) {
          match = routeMatchFn({
            ...config,
            basename: this.getBasename(),
            locate: location,
          });
        }

        afterRouteDiscover && afterRouteDiscover(match);

        return match;
      };
    }

    return activityFunction;
  }

  getPageContainer() {
    return this.pageContainer;
  }

  setPageContainer(pageContainer: HTMLElement) {
    this.pageContainer = pageContainer;
  }
}
