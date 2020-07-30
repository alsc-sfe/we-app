import { getScopeName } from '@saasfe/we-app-utils';
import { HookDesc, HookDescRunnerParam, HookOpts, UsingHookOpts } from '@saasfe/we-app-types';

export interface Hook403Opts extends HookOpts {
  excludePages?: string[];
  check403?: (pageAuthCode: string) => Promise<boolean|object>;
  [prop: string]: any;
}

let is403 = false;

const hook403Desc: HookDesc<Hook403Opts> = {
  page: {
    hooks: ['pageContainer', '500'],
    activityFunction: () => is403,
  },

  async beforeRouting(param: HookDescRunnerParam<Hook403Opts>) {
    const { opts: { excludePages = [] }, hookPages = [], pageScope, hookPageScope } = param;
    const pageName = getScopeName(pageScope);
    // 从当前路由解析出当前激活的页面
    if (pageName && hookPages.concat(excludePages).indexOf(pageName) === -1) {
      // 获取当前页面对应的权限码
      if (pageScope) {
        const { opts: { check403 } } = param;
        let pageAuth = pageScope.getConfig('pageAuth');
        if (pageAuth === undefined) {
          pageAuth = pageScope.getConfig('pageAuthCode');
        }

        if (!check403) {
          is403 = false;
          return;
        }

        const res = await check403(pageAuth);
        is403 = !!res;

        if (is403 && hookPageScope) {
          // 设置hook 403页面渲染参数
          hookPageScope.setCustomProps(res as object);
        }
      }
    }
  },

  async beforeMount() {
    // 阻止渲染
    return !is403;
  },
};

const hook403: UsingHookOpts<Hook403Opts> = {
  hookName: '403',
  hookDesc: hook403Desc,
};

export default hook403;
