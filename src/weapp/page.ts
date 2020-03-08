/**
 * 首次访问时，需要执行beforeRouting，
 * 而此时一旦向singleSpa中注册了页面，则会触发singleSpa的reroute，
 * 导致页面直接进入渲染，跳过了生命周期routing
 * 所以，需要先缓存配置，再统一执行singleSpa注册，
 * 在首次访问时，通过调用page的makeActivityFunction，手动获取activeScopes
 */
import { registerApplication } from 'single-spa';
import { getScopeName, checkUseSystem } from '../helpers';
import Base, { BaseConfig, BaseType, Render } from './base';
import { HookScope, LifecycleHookEnum } from '../hooks/type';
import WeApp from './weapp';
import { Resource } from '../resource-loader';
import { runLifecycleHook } from '../hooks';
import { DEFAULTRouteMatch as routeMatchFn, Route } from '../routing';
import { ajustPathname } from '../routing/util';
import { matchHomepage } from './homepage';

export interface PageConfig extends BaseConfig {
  parent?: WeApp;

  hookName?: string;

  activityFunction?: ActivityFunction;

  // 页面标题
  // 规范：https://yuque.antfin-inc.com/ele-fe/zgm9ar/lmk4t9
  title?: string;
  // 路由的定义，始终显示 true, 微应用内相对路径 /page, 绝对路径 ~/product/weapp/page
  path?: Route;
  route?: Route;
  routeIgnore?: Route;

  // 一般为一个js、一个css
  url?: Resource[];

  customProps?: object;

  [prop: string]: any;
}

export type ActivityFunction = (location?: Location) => boolean;

export default class Page extends Base {
  type: BaseType = BaseType.page;

  parent: WeApp;

  private pageContainer: Element;

  constructor(config: PageConfig) {
    super(config);

    this.setInited();
  }

  start() {
    const scope: HookScope = this.compoundScope(this);

    registerApplication(
      getScopeName(scope),
      async () => {
        await runLifecycleHook(LifecycleHookEnum.beforeLoad, [scope], {
          getRender: () => {
            return this.getRender();
          },
        });

        const resourceLoader = this.getConfig('resourceLoader');
        const url = this.getConfig('url') || [];
        const useSystem = this.getConfig('useSystem') || [];
        const urlUseSystem = checkUseSystem(useSystem, 'url');

        const mountedUrl = url.map((r) => {
          return resourceLoader.mount(r, scope, { useSystem: urlUseSystem });
        });
        // 获取第一个不为空的返回值
        const component = await Promise.all(mountedUrl).then((resources) => {
          const resource = resources.find((r) => r);
          return resource;
        }).then((resource: any) => resource?.default || resource);

        await runLifecycleHook(LifecycleHookEnum.afterLoad, [scope]);

        return {
          bootstrap: [async () => component],
          mount: [
            // beforeMount
            async (customProps: object) => {
              const isContinue = await runLifecycleHook(LifecycleHookEnum.beforeMount, [scope], {
                getRender: () => {
                  return this.getRender();
                },
              });
              if (!isContinue) {
                return;
              }

              const container = this.getPageContainer();
              const render = this.getRender();
              render?.mount(component, container, {
                ...this.getConfig('customProps'),
                ...customProps,
              });

              // afterMount
              await runLifecycleHook(LifecycleHookEnum.afterMount, [scope]);
            },
          ],
          unmount: [
            // beforeUnmount
            async (customProps) => {
              const isContinue = await runLifecycleHook(LifecycleHookEnum.beforeUnmount, [scope], {
                getRender: () => {
                  return this.getRender();
                },
              });
              if (!isContinue) {
                return;
              }

              const container = this.getPageContainer();
              const render = this.getRender();
              render?.unmount(container, {
                ...this.getConfig('customProps'),
                ...customProps,
              });

              // afterUnmount
              await runLifecycleHook(LifecycleHookEnum.afterUnmount, [scope]);
            },
          ],
        };
      },
      this.makeActivityFunction(),
      {
        pageScope: scope,

        basename: this.getBasename(),
        routerType: this.getConfig('routerType'),
      },
    );
  }

  getBasename() {
    const scope = this.compoundScope(this);
    const { productName = '', weAppName = '', weApp } = scope;

    const basename = weApp.getConfig('basename') as string;
    if (basename) {
      return ajustPathname(basename);
    }

    return ajustPathname(`/${productName}/${weAppName}`);
  }

  makeActivityFunction() {
    const config = this.getConfig();
    const { routeIgnore, afterRouteDiscover } = config;

    let { route } = config;
    // 兼容规范：https://yuque.antfin-inc.com/ele-fe/zgm9ar/lmk4t9
    route = config.path || route;

    let { activityFunction } = config;

    // hook添加的页面会返回activityFunction
    if (activityFunction) {
      return activityFunction;
    }

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

  setPageContainer(pageContainer: Element) {
    this.pageContainer = pageContainer;
  }

  setCustomProps(customProps: any) {
    this.setConfig({
      customProps,
    });
  }
}
