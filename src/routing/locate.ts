/* eslint-disable @typescript-eslint/no-use-before-define */
import { RouterType } from './enum';
import { parseRouteParams, Route, RouteObj, isAbsolutePathname } from './route';
import { isObj, isString, ajustPathname } from './util';

// 路径由basename+微应用名称+页面路径，三部分构成
export function getPathnamePrefix({ basename = '', absolute = false, appBasename = '' }) {
  if (absolute) {
    return ajustPathname(`/${appBasename}`);
  }
  return ajustPathname(`/${basename}`);
}

export type Locate = string | Location | AppLocation;

export class AppLocation {
  routerType: RouterType;

  pathname: string;

  basename: string;

  appBasename: string;

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
  appBasename = '',
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
        appBasename,
        pathname: (locate as Location).pathname,
        search: locate.search as string,
        query: {},
        params: {},
      });

      loc.query = parseQuery({
        locate: loc,
        routerType,
        basename,
        appBasename,
      });

      if (route) {
        loc.params = parseRouteParams({
          route,
          locate,
          basename,
          appBasename,
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
    appBasename,
    pathname: defaultPathname,
    search: '',
    query: {},
    params: {},
  });

  // 修正部分场景路由写成 #xxx 而不是 #/xxx
  locStr = (`/${locStr.replace('#', '')}`).replace(/\/{2,}/g, '/');
  const match = /^([^?]*)(\?[^?]*)?/g.exec(locStr);
  if (match) {
    loc = new AppLocation({
      routerType,
      basename,
      appBasename,
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
    appBasename,
  });

  if (route) {
    loc.params = parseRouteParams({
      route,
      locate,
      basename,
      appBasename,
      routerType,
    });
  }

  return loc;
}

function parseQuery({
  locate = window.location,
  routerType = RouterType.browser,
  basename = '',
  appBasename = '',
}: ParseLocationParams) {
  const { search } = parseLocate({
    locate,
    routerType,
    basename,
    appBasename,
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

interface GetGotoPathnameParams {
  to: Route;
  basename?: string;
  appBasename?: string;
}

function getGotoPathname({
  to,
  basename = '',
  appBasename = '',
}: GetGotoPathnameParams) {
  let link = to.toString();

  if (isObj(to)) {
    const { path, pathname, query } = to as RouteObj;
    link = path || pathname;

    let search: string | object = query;
    if (isObj(query)) {
      const params = Object.keys(query).map(k => `${k}=${encodeURIComponent(query[k] || '')}`);
      search = params.join('&');
    }
    if (search) {
      link = `${link}?${search}`.replace('??', '?');
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
  const pathnamePrefix = getPathnamePrefix({ basename, absolute, appBasename });
  gotoPathname = ajustPathname(`${pathnamePrefix}${link === '/' ? '' : link}`);

  return gotoPathname;
}

export interface GetGotoHrefParams {
  to: Route;
  routerType?: RouterType;
  basename?: string;
  appBasename?: string;
}
// 返回带routerType的href
export function getGotoHref({
  to,
  routerType = RouterType.browser,
  basename = '',
  appBasename = '',
}: GetGotoHrefParams) {
  const gotoPathname = getGotoPathname({
    to,
    basename,
    appBasename,
  });
  const gotoHref = ajustPathname(`${routerType}${gotoPathname}`);

  return gotoHref;
}
