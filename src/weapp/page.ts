/**
 * 首次访问时，需要执行beforeRouting，
 * 而此时一旦向singleSpa中注册了页面，则会触发singleSpa的reroute，
 * 导致页面直接进入渲染，跳过了生命周期routing
 * 所以，需要先缓存配置，再统一执行singleSpa注册，
 * 在首次访问时，通过调用page的makeActivityFunction，手动获取activeScopes
 */
import { registerApplication, unloadApplication } from 'single-spa';
import { getScopeName, makeSafeScope } from '../utils/helpers';
import Base, { BaseConfig, BaseType, ApplicationCustomProps } from './base';
import { HookScope, LifecycleHookEnum } from '../hooks/type';
import App from './app';
import { Resource } from '../resource-loader';
import { runLifecycleHook } from '../hooks';
import { DEFAULTRouteMatch as routeMatchFn, Route } from '../routing';
import { ajustPathname } from '../utils/util';
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

export interface LifecycleParams {
  customProps?: object;
  scope?: HookScope;
  component?: any;
  [prop: string]: any;
}

export default class Page extends Base {
  type: BaseType = BaseType.page;

  parent: App;

  private component: any;

  constructor(config: PageConfig) {
    super(config);

    if (config.path) {
      config.route = config.path;
    }

    this.setInited();
  }

  start() {
    const scope: HookScope = this.compoundScope(this);

    registerApplication<ApplicationCustomProps>(
      getScopeName(scope),
      {
        bootstrap: async () => {},
        mount: async (customProps: ApplicationCustomProps) => {
          this.component = await this.load({ customProps, scope });
          await this.mount({ customProps, scope, component: this.component });
        },
        unmount: async (customProps: ApplicationCustomProps) => {
          await this.unmount({ customProps, scope, component: this.component });
        },
      },
      this.makeActivityFunction(),
      {
        pageScope: makeSafeScope(scope),
        appBasename: this.getAppBasename(),
        basename: this.getBasename(),
        routerType: this.getRouterType(),
        global: window, // sandbox global
      },
    );
  }

  getRender() {
    const render = super.getRender();
    if (render) {
      let renderWrapper = render;
      if (this.type === BaseType.page) {
        const container = this.getPageContainer();
        renderWrapper = {
          mount: (element, node, customProps) => {
            render.mount(element, node || container, customProps);
          },
          unmount: (node, element, customProps) => {
            render.unmount(node || container, element, customProps);
          },
        };
      }
      return renderWrapper;
    }
  }

  getAppBasename() {
    // 整个站点的路由前缀，如代运营场景中 /xxx/xxx/xxx/saas-crm
    const appBasename = this.getData(DataName.basename, true) as string || '';
    return ajustPathname(`/${appBasename}`);
  }

  getBasename() {
    const scope = this.compoundScope(this);
    const { productName = '', appName = '', app } = scope;

    const appBasename = this.getData(DataName.basename, true) as string || '';

    const basename = app.getConfig('basename') as string;
    if (basename) {
      return ajustPathname(`/${appBasename}/${basename}`);
    }

    return ajustPathname(`/${appBasename}/${productName}/${appName}`);
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
        const productBasename = this.getAppBasename();
        let { pathname } = location;
        if (routerType === RouterType.hash) {
          const matchPath = location.hash.match(/^#([^?]*)/);
          if (matchPath) {
            pathname = matchPath[1];
          }
          pathname = pathname || '/';
        }
        // 匹配首页
        let match = [productBasename, `${productBasename}/`].indexOf(pathname) > -1 &&
          matchHomepage(this.compoundScope(this));
        // 匹配页面路由
        if (!match) {
          match = routeMatchFn({
            ...config,
            route,
            basename: this.getBasename(),
            appBasename: this.getAppBasename(),
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

  setCustomProps(customProps: any) {
    this.setData(DataName.customProps, customProps);
  }

  private async load({ scope }: LifecycleParams) {
    await runLifecycleHook(LifecycleHookEnum.beforeLoad, [scope]);

    const { desc: resourceLoader, config: resourceLoaderOpts } = this.getResourceLoader();
    let url = this.getConfig('url') as Resource[] || [];
    if (!Array.isArray(url)) {
      url = [url];
    }

    const component = resourceLoader.mount(url, makeSafeScope(scope), resourceLoaderOpts);

    await runLifecycleHook(LifecycleHookEnum.afterLoad, [scope]);

    return component;
  }

  private async mount({ customProps, scope, component }: LifecycleParams) {
    const isContinue = await runLifecycleHook(LifecycleHookEnum.beforeMount, [scope]);
    if (!isContinue) {
      await runLifecycleHook(LifecycleHookEnum.onMountPrevented, [scope]);
      return;
    }

    const container = this.getPageContainer();

    if (!container) {
      // 没有渲染容器，但是singleSpa仍然做了渲染
      // 需要调整当前app的状态，以便singleSpa下次再渲染
      unloadApplication(getScopeName(scope));
      return;
    }

    const render = this.getRender();
    render?.mount?.(component, container, {
      ...this.getData(DataName.customProps),
      ...customProps,
      context: getContext(),
    });

    // 页面未渲染则认为没有mount
    await runLifecycleHook(LifecycleHookEnum.afterMount, [scope]);
  }

  private async unmount({ customProps, scope, component }: LifecycleParams) {
    const isContinue = await runLifecycleHook(LifecycleHookEnum.beforeUnmount, [scope]);
    if (!isContinue) {
      return;
    }

    const container = this.getPageContainer();

    if (container) {
      const render = this.getRender();
      render?.unmount?.(container, component, {
        ...this.getData(DataName.customProps),
        ...customProps,
        context: getContext(),
      });
    }

    const { desc: resourceLoader, config: resourceLoaderOpts } = this.getResourceLoader();
    let url = this.getConfig('url') as Resource[] || [];
    if (!Array.isArray(url)) {
      url = [url];
    }

    resourceLoader.unmount(url, makeSafeScope(scope), resourceLoaderOpts);

    // afterUnmount
    await runLifecycleHook(LifecycleHookEnum.afterUnmount, [scope]);
  }
}
