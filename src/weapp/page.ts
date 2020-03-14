/**
 * 首次访问时，需要执行beforeRouting，
 * 而此时一旦向singleSpa中注册了页面，则会触发singleSpa的reroute，
 * 导致页面直接进入渲染，跳过了生命周期routing
 * 所以，需要先缓存配置，再统一执行singleSpa注册，
 * 在首次访问时，通过调用page的makeActivityFunction，手动获取activeScopes
 */
import { registerApplication } from 'single-spa';
import { getScopeName, makeSafeScope } from '../helpers';
import Base, { BaseConfig, BaseType, Render } from './base';
import { HookScope, LifecycleHookEnum } from '../hooks/type';
import App from './app';
import { Resource, ResourceLoader } from '../resource-loader';
import { runLifecycleHook } from '../hooks';
import { DEFAULTRouteMatch as routeMatchFn, Route } from '../routing';
import { ajustPathname } from '../routing/util';
import { matchHomepage } from './homepage';
import { RouterType } from '../routing/enum';
import { getContext } from '../context';
import { DataName } from '../const';

export interface PageConfig extends BaseConfig {
  parent?: App;

  activityFunction?: ActivityFunction;

  // 页面标题
  // 规范：https://yuque.antfin-inc.com/ele-fe/zgm9ar/lmk4t9
  title?: string;
  // 路由的定义，始终显示 true, 微应用内相对路径 /page, 绝对路径 ~/product/weapp/page
  path?: Route;
  route?: Route;
  routeIgnore?: Route;

  // 一般为一个js、一个css
  url?: Resource|Resource[];

  customProps?: object;
}

export type ActivityFunction = (location?: Location) => boolean;

export default class Page extends Base {
  type: BaseType = BaseType.page;

  parent: App;

  constructor(config: PageConfig) {
    super(config);

    if (config.path) {
      config.route = config.path;
    }

    this.setInited();
  }

  start() {
    const scope: HookScope = this.compoundScope(this);

    registerApplication(
      getScopeName(scope),
      async () => {
        await runLifecycleHook(LifecycleHookEnum.beforeLoad, [scope]);

        const { desc: resourceLoader, config: resourceLoaderOpts } = this.getResourceLoader();
        let url = this.getConfig('url') as Resource[] || [];
        if (!Array.isArray(url)) {
          url = [url];
        }

        const mountedUrl = url.map((r) => {
          return resourceLoader.mount(r, scope, resourceLoaderOpts);
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
              const isContinue = await runLifecycleHook(LifecycleHookEnum.beforeMount, [scope]);
              if (!isContinue) {
                await runLifecycleHook(LifecycleHookEnum.onMountPrevented, [scope]);
                return;
              }

              const container = this.getPageContainer();
              const render = this.getRender();
              render?.mount(component, container, {
                ...this.getData(DataName.customProps),
                ...customProps,
                context: getContext(),
              });

              // afterMount
              await runLifecycleHook(LifecycleHookEnum.afterMount, [scope]);
            },
          ],
          unmount: [
            // beforeUnmount
            async (customProps) => {
              const isContinue = await runLifecycleHook(LifecycleHookEnum.beforeUnmount, [scope]);
              if (!isContinue) {
                return;
              }

              const container = this.getPageContainer();
              const render = this.getRender();
              render?.unmount(container, {
                ...this.getData(DataName.customProps),
                ...customProps,
                context: getContext(),
              });

              url.map((r) => {
                return resourceLoader.unmount(r, scope, resourceLoaderOpts);
              });

              // afterUnmount
              await runLifecycleHook(LifecycleHookEnum.afterUnmount, [scope]);
            },
          ],
        };
      },
      this.makeActivityFunction(),
      {
        pageScope: makeSafeScope(scope),

        basename: this.getBasename(),
        routerType: this.getRouterType(),
      },
    );
  }

  getRender() {
    const render = super.getRender();
    if (render) {
      let renderWrapper = render;
      if (this.type === BaseType.page) {
        const container = this.getPageContainer() as Element;
        renderWrapper = {
          mount: (element, node, customProps) => {
            render.mount(element, node || container, customProps);
          },
          unmount: (node, customProps) => {
            render.unmount(node || container, customProps);
          },
        };
      }
      return renderWrapper;
    }
  }

  getBasename() {
    const scope = this.compoundScope(this);
    const { productName = '', appName = '', app } = scope;

    const basename = app.getConfig('basename') as string;
    if (basename) {
      return ajustPathname(basename);
    }

    return ajustPathname(`/${productName}/${appName}`);
  }

  makeActivityFunction() {
    const config = this.getConfig();
    const routerType = this.getRouterType();
    const { routeIgnore, afterRouteDiscover } = config;

    let { route } = config;
    // 兼容规范：https://yuque.antfin-inc.com/ele-fe/zgm9ar/lmk4t9
    route = config.path || route;

    let { activityFunction } = config;

    // hook添加的页面会返回activityFunction
    if (activityFunction) {
      return (location: Location) => {
        const match = activityFunction(location);
        afterRouteDiscover && afterRouteDiscover(match);
        return match;
      };
    }

    if (route === true && !routeIgnore) {
      activityFunction = () => {
        afterRouteDiscover && afterRouteDiscover(true);
        return true;
      };
    } else {
      activityFunction = (location: Location) => {
        let { pathname } = location;
        if (routerType === RouterType.hash) {
          pathname = location.hash.replace('#', '') || '/';
        }
        // 匹配首页
        let match = pathname === '/' &&
          matchHomepage(this.compoundScope(this));
        // 匹配页面路由
        if (!match) {
          match = routeMatchFn({
            ...config,
            basename: this.getBasename(),
            locate: location,
            routerType,
          });
        }

        afterRouteDiscover && afterRouteDiscover(match);

        return match;
      };
    }

    return activityFunction;
  }

  setPageContainer(pageContainer: Element) {
    this.setData(DataName.pageContainer, pageContainer);
  }

  setCustomProps(customProps: any) {
    this.setData(DataName.customProps, customProps);
  }
}
