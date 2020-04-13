/* eslint-disable @typescript-eslint/no-use-before-define */
import { RouterType } from './enum';
import { parseRouteParams, Route, RouteObj, isAbsolutePathname } from './route';
import { isObj, isString, ajustPathname } from './util';

// 路径由basename+微应用名称+页面路径，三部分构成
export function getPathnamePrefix({ basename = '', absolute = false }) {
  if (absolute) {
    return '/';
  }
  return ajustPathname(`/${basename}`);
}

export type Locate = string | Location | AppLocation;

export class AppLocation {
  routerType: RouterType;

  pathname: string;

  basename: string;

  search: string;

  query: object;

  params: object;

  constructor(loc: Locate) {
    Object.keys(loc).forEach(k => {
      this[k] = loc[k];
    });
  }
}

export interface ParseLocationParams {
  locate: Locate;
  routerType: RouterType;
  basename: string;
  route?: Route;
  [prop: string]: any;
}

// 将路径解析为Location对象
export function parseLocate({
  locate = window.location,
  routerType = RouterType.browser,
  basename = '',
  route,
}: ParseLocationParams) {
  if (locate instanceof AppLocation) {
    return locate;
  }

  const defaultPathname = '/';

  let locStr: string;
  let loc: AppLocation;

  if (isObj(locate, '[object Location]') || isObj(locate)) {
    if (routerType === RouterType.browser) {
      loc = new AppLocation({
        routerType,
        basename,
        pathname: (locate as Location).pathname,
        search: locate.search as string,
        query: {},
        params: {},
      });

      loc.query = parseQuery({
        locate: loc,
        routerType,
        basename,
      });

      if (route) {
        loc.params = parseRouteParams({
          route,
          locate,
          basename,
          routerType,
        });
      }

      return loc;
    }

    // 路由hash模式下，取hash，或者为默认地址
    locStr = (locate as Location).hash || `#${defaultPathname}`;
  }

  if (isString(locate)) {
    locStr = locate as string;
  }

  loc = new AppLocation({
    routerType,
    basename,
    pathname: defaultPathname,
    search: '',
    query: {},
    params: {},
  });

  // 修正部分场景路由写成 #xxx 而不是 #/xxx
  locStr = (`/${locStr.replace('#', '')}`).replace(/\/{2}/g, '/');
  const match = /^([^?]*)(\?[^?]*)?/g.exec(locStr);
  if (match) {
    loc = new AppLocation({
      routerType,
      basename,
      pathname: match[1],
      search: match[2] || '',
      query: {},
      params: {},
    });
  }

  loc.query = parseQuery({
    locate: loc,
    routerType,
    basename,
  });

  if (route) {
    loc.params = parseRouteParams({
      route,
      locate,
      basename,
      routerType,
    });
  }

  return loc;
}

export function parseQuery({
  locate = window.location,
  routerType = RouterType.browser,
  basename = '',
}: ParseLocationParams) {
  const { search } = parseLocate({
    locate,
    routerType,
    basename,
  });

  const query = {};
  if (search) {
    search.slice(1).split('&').forEach(q => {
      const pair = q.split('=');
      query[pair[0]] = decodeURIComponent(pair[1] || '');
    });
  }

  return query;
}

export interface GetGotoPathnameParams {
  to: Route;
  basename: string;
}

export function getGotoPathname({
  to,
  basename = '',
}: GetGotoPathnameParams) {
  let link = to.toString();

  if (isObj(to)) {
    const { path, query } = to as RouteObj;
    link = path;

    let search: string | object = query;
    if (isObj(query)) {
      const params = Object.keys(query).map(k => `${k}=${encodeURIComponent(query[k] || '')}`);
      search = params.join('&');
    }
    if (search) {
      link = `${path}?${search}`.replace('??', '?');
    }
  }

  const absolute = isAbsolutePathname(link);

  if (absolute) {
    link = link.slice(1);
  }

  let gotoPathname = link;
  // 应用内路径指定为/时，自动去除，以便于路径匹配，
  // href /org 可以匹配 pathname /org/
  // href /org/ 无法匹配 pathname /org
  const pathnamePrefix = getPathnamePrefix({ basename, absolute });
  gotoPathname = ajustPathname(`${pathnamePrefix}${link === '/' ? '' : link}`);

  return gotoPathname;
}

export interface GetGotoHrefParams {
  to: Route;
  routerType?: RouterType;
  basename?: string;
}
// 返回带routerType的href
export function getGotoHref({
  to,
  routerType = RouterType.browser,
  basename = '',
}: GetGotoHrefParams) {
  const gotoPathname = getGotoPathname({
    to,
    basename,
  });
  const gotoHref = ajustPathname(`${routerType}${gotoPathname}`);

  return gotoHref;
}
