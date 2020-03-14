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
      path: rt.absolute ? `~${rt.pathname}` : rt.pathname,
    };
  });
}

export async function transformAppConfig(appConfig: MicroAppConfig): Promise<AppConfig> {
  if (!(appConfig.microAppName && appConfig.modules)) {
    return appConfig;
  }

  return {
    name: appConfig.microAppName,
    pages: appConfig.modules.map((module): PageConfig => {
      return {
        ...module,
        name: module.moduleName,
        url: [module.getComponent],
        route: transformRoute(module.route),
        routeIgnore: transformRoute(module.routeIgnore),
      };
    }),
    ...appConfig,
  };
}
