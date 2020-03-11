import { getScopeName } from '../../helpers';
import { HookDesc, HookDescRunnerParam, HookOpts, UsingHookOpts } from '../type';

export interface Hook403Opts extends HookOpts {
  excludePages?: string[];
  check403?: (pageAuthCode: string) => Promise<boolean|object>;
  [prop: string]: any;
}

let is403 = false;

const hook403Desc: HookDesc<Hook403Opts> = {
  hookName: '403',
  page: {
    hooks: ['pageContainer', '500'],
    activityFunction: () => is403,
  },

  async beforeRouting(param: HookDescRunnerParam<Hook403Opts>) {
    const { opts: { excludePages = [] }, hookPages = [], pageScope, hookPageScope } = param;
    const pageName = getScopeName(pageScope);
    // 从当前路由解析出当前激活的页面
    if (hookPages.concat(excludePages).indexOf(pageName) === -1) {
      const { page } = pageScope;
      // 获取当前页面对应的权限码
      if (page) {
        const { opts: { check403 } } = param;
        const pageAuth = page.getConfig('pageAuth') || page.getConfig('pageAuthCode');

        if (!check403) {
          is403 = false;
          return;
        }

        const res = await check403(pageAuth);
        is403 = !!res;

        if (is403 && hookPageScope) {
          // 设置hook 403页面渲染参数
          hookPageScope.page.setCustomProps(res);
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
