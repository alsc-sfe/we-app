/* eslint-disable @typescript-eslint/no-use-before-define */
import pathToRegexp from 'path-to-regexp';
import { isString, isBoolean, isObj, ajustPathname } from './util';
import { ParseLocationParams, parseLocate, getPathnamePrefix, Locate } from './locate';
import { RouterType } from './enum';

export interface RouteObj {
  path: string;
  query?: object;
  exact?: boolean;
  strict?: boolean;
  [prop: string]: any;
}

// true, 始终匹配
// /home/:id, 匹配 /home/123
// /home/:id, 当前微应用内路由
// ~/user/home/:id, 当前产品内路由，在basename为空的情况下，微应用名称为user
export type SimpleRoute = boolean | string | RouteObj;
export type Route = SimpleRoute | SimpleRoute[];

export interface ParseRoute {
  route: Route;
  basename: string;
}

// 所有的路由规则统一处理成添加了basename的形式，简化后续的处理方式
// 丢弃bool
export function parseRoute({
  route,
  basename = '',
}: ParseRoute) {
  if (!route) {
    return [];
  }

  let routes = route;
  if (!Array.isArray(route)) {
    routes = [route];
  }

  const newRoutes: RouteObj[] = [];
  (routes as SimpleRoute[]).forEach(r => {
    if (isString(r)) {
      newRoutes.push({
        path: getRoutePathname({
          path: r as string,
          basename,
        }),
      });
    } else if (isObj(r)) {
      newRoutes.push({
        ...(r as RouteObj),
        path: getRoutePathname({
          path: (r as RouteObj).path,
          basename,
        }),
      });
    }
  });

  return newRoutes;
}

interface GetRoutePathnameParams {
  path: string;
  basename?: string;
}

export function isAbsolutePathname(pathname: string) {
  if (!isString(pathname)) {
    return false;
  }

  return pathname[0] === '~';
}

function getRoutePathname({
  path,
  basename = '',
}: GetRoutePathnameParams) {
  if (!isString(path)) {
    return path;
  }

  let fullPathname = path;

  const absolute = isAbsolutePathname(path);
  const pathnamePrefix = getPathnamePrefix({
    basename,
    absolute,
  });

  if (absolute) {
    fullPathname = fullPathname.slice(1) || '';
  }

  fullPathname = ajustPathname(`${pathnamePrefix}/${fullPathname}`);

  return fullPathname;
}

export interface ParseRouteParams extends ParseLocationParams {
  route: Route;
}

// route仅支持字符串，对象，字符串、对象的混合数组
export function parseRouteParams({
  route = '',
  locate = window.location,
  routerType = RouterType.browser,
  basename = '',
}: ParseRouteParams) {
  const loc = parseLocate({
    locate,
    routerType,
    basename,
  });
  const { pathname } = loc;

  const routes = parseRoute({
    route,
    basename,
  });

  let params = {};

  for (let i = 0, len = routes.length; i < len; i += 1) {
    const tmpRoute = routes[i];

    const keys = [];
    const reg = pathToRegexp(tmpRoute.path, keys);
    if (keys.length > 0) {
      const match = reg.exec(pathname);
      if (match) {
        params = {};
        // eslint-disable-next-line no-loop-func
        keys.forEach((key, index) => {
          params[key.name] = match[index + 1];
        });
        break;
      }
    }
  }

  return params;
}

export function getRouteSwitchConfig(gotoHref: string, routerType: RouterType) {
  const isBrowserHistory = routerType === RouterType.browser;
  const config = isBrowserHistory ? {
    onClick: (e) => {
      e.preventDefault();
      history.pushState(null, null, gotoHref);
    },
  } : {};
  return config;
}

export interface RouteMatchParams {
  route?: Route;
  routeIgnore?: Route;
  locate?: Locate;
  exact?: boolean;
  strict?: boolean;
  basename: string;
  routerType?: RouterType;
  [prop: string]: any;
}

export type RouteMatch = (params: RouteMatchParams) => boolean;

export const DEFAULTRouteMatch: RouteMatch = function DEFAULTRouteMatch({
  route, routeIgnore, exact, strict,
  locate = window.location,
  basename = '',
  routerType = RouterType.browser,
}) {
  const needIgnore = route === true || !route;
  const currentRoutes = needIgnore ? routeIgnore : route;

  let match = false;

  const routes = parseRoute({
    route: currentRoutes,
    basename,
  });

  const loc = parseLocate({
    locate,
    routerType,
    basename,
  });

  const { pathname } = loc;

  for (let i = 0, len = routes.length; i < len; i += 1) {
    const tmpRoute = routes[i];

    if (isObj(tmpRoute) && tmpRoute.path) {
      const tmpExact = isBoolean(tmpRoute.exact) ? tmpRoute.exact : exact;
      const tmpStrict = isBoolean(tmpRoute.strict) ? tmpRoute.strict : strict;
      const tmpPath = pathname;

      let keys = [];
      // pathToRegexp只匹配/one/:param的形式，但无法匹配/one/:param/two
      let regexp = pathToRegexp(tmpRoute.path, keys, {
        strict: tmpStrict,
      });
      if (keys.length > 0) {
        match = regexp.test(tmpPath);

        if (match) {
          break;
        }

        // pathToRegexp是完全匹配的，针对exact为false，需增加后置匹配
        if (!match && !tmpExact) {
          keys = [];
          regexp = pathToRegexp(`${tmpRoute.path}/.*`, keys, {
            strict: tmpStrict,
          });
        }
      }

      if (keys.length > 0) {
        match = regexp.test(tmpPath);
      } else {
        // 自行组装正则匹配
        // exact: 完全匹配, strict: 结尾无/
        regexp = new RegExp(`^${tmpRoute.path}${tmpExact ? '' : '(?:/.*)?'}${tmpStrict ? '' : '(?:/)?'}$`);
        match = regexp.test(tmpPath);
      }

      if (match) {
        break;
      }
    }
  }

  return needIgnore ? !match : match;
};
