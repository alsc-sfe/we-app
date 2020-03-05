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

  [prop: string]: any;
}

export type ActivityFunction = (location?: Location) => boolean;

export default class Page extends Base {
  type: BaseType = BaseType.page;

  parent: WeApp;

  private pageContainer: HTMLElement;

  constructor(config: PageConfig) {
    super(config);

    this.setInited();
  }

  start() {
    const resourceLoader = this.getConfig('resourceLoader');
    const url = this.getConfig('url') || [];
    const useSystem = this.getConfig('useSystem') || [];

    const scope: HookScope = this.compoundScope(this);

    const urlUseSystem = checkUseSystem(useSystem, 'url');

    registerApplication(
      getScopeName(scope),
      async () => {
        // beforeLoad
        const render = this.getRender() as Render;
        await runLifecycleHook(LifecycleHookEnum.beforeLoad, [scope], {
          render,
        });

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
              const isContinues = await runLifecycleHook(LifecycleHookEnum.beforeMount, [scope], {
                render,
              });
              if (isContinues.find((i) => i === false) === false) {
                return;
              }

              const container = this.getPageContainer();

              render.mount(component, container, customProps);

              // afterMount
              await runLifecycleHook(LifecycleHookEnum.afterMount, [scope]);
            },
          ],
          unmount: [
            // beforeUnmount
            async (customProps) => {
              const isContinues = await runLifecycleHook(LifecycleHookEnum.beforeUnmount, [scope], {
                render,
              });
              if (isContinues.find((i) => i === false) === false) {
                return;
              }

              const container = this.getPageContainer();
              render.unmount(container, customProps);

              // afterUnmount
              await runLifecycleHook(LifecycleHookEnum.afterUnmount, [scope]);
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

  setPageContainer(pageContainer: HTMLElement) {
    this.pageContainer = pageContainer;
  }
}
