import { ResourceFunction } from '../resource-loader';
import { Route as TRoute } from '../routing';
import { AppConfig } from './app';
import { PageConfig } from './page';
import { resourcePreloader } from '../utils/helpers';

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
  route: string|string[]|true|Route|Route[];
  routeIgnore: Route[];
  getComponent: ResourceFunction;
  [prop: string]: any;
}

export interface MicroAppConfig extends AppConfig {
  microAppName?: string;
  modules?: Module[];
}

function transformRoute(route: string|string[]|true|Route|Route[]): TRoute {
  if (['string', 'boolean', 'undefined'].indexOf(typeof route) > -1) {
    return route as string|true;
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
