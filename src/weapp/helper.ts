import { ResourceFunction } from '../resource-loader';
import { Route as TRoute } from '../routing';
import { AppConfig } from './app';
import { PageConfig } from './page';

interface Route {
  pathname: string;
  absolute?: boolean;
  exact?: boolean;
  strict?: boolean;
}

interface Module {
  module: string;
  moduleReal: string;
  moduleName: string;
  route: string|string[]|boolean|Route|Route[];
  routeIgnore: Route[];
  getComponent: ResourceFunction;
  [prop: string]: any;
}

export interface MicroAppConfig extends AppConfig {
  microAppName?: string;
  modules?: Module[];
}

function transformRoute(route: string|string[]|boolean|Route|Route[]): TRoute {
  if (['string', 'boolean', 'undefined'].indexOf(typeof route) > -1) {
    return route as string|boolean;
  }
  const routes = Array.isArray(route) ? route : [route];
  return routes.map((r) => {
    if (typeof r === 'string') {
      return r;
    }

    const rt = r as Route;
    return {
      ...rt,
      // 此处忽略 absolute，之前都是通过 pathname: '/', absolute: true来指定首页
      path: rt.pathname,
    };
  });
}

export function resourcePreloader(url: string, type = 'prefetch') {
  if (typeof url !== 'string' || !url) {
    return;
  }

  const link = document.createElement('link');
  link.rel = type;
  link.crossOrigin = 'anonymous';
  link.href = url;
  if (url.indexOf('.js') > -1) {
    link.as = 'script';
  } else if (url.indexOf('.css') > -1) {
    link.as = 'style';
  } else {
    return;
  }
  document.querySelector('head').appendChild(link);
}

export async function transformAppConfig(microAppConfig: MicroAppConfig, { resourceLoader }): Promise<AppConfig> {
  let appConfig = microAppConfig;
  if (appConfig?.url) {
    appConfig = await resourceLoader(
      appConfig.url,
      { useSystem: true }
    );
    appConfig = appConfig.default || appConfig;
  }

  if (appConfig.microAppName && appConfig.modules) {
    appConfig = {
      name: appConfig.microAppName,
      pages: appConfig.modules.map((module): PageConfig => {
        return {
          ...module,
          name: module.moduleName || module.module,
          url: [module.getComponent],
          route: transformRoute(module.route),
          routeIgnore: transformRoute(module.routeIgnore),
        };
      }),
      ...appConfig,
    };
  }

  // preload
  appConfig?.pages?.forEach(({ url }) => {
    (url as string[])?.forEach((resource) => {
      resourcePreloader(resource);
    });
  });

  return appConfig;
}
