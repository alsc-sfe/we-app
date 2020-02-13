import { getPageName } from '../../helpers';
import { Hook, HookScope } from '../type';

const ExcludePages = [
  getPageName({ hookName: '404' }),
  getPageName({ hookName: '403' }),
  getPageName({ hookName: '500' }),
];

export interface Hook404Opts {
  element: any;
  excludePages?: string[];
}

const hook404: Hook<Hook404Opts> = function () {
  let is404 = false;
  return {
    page: {
      activityFunction: () => is404,
      render: {
        mount({ productName, weAppName, pageName, render, opts: { element } }) {
          render.mount(
            element,
            { productName, weAppName, pageName }
          );
        },
        unmount() {},
      },
    },

    async beforeRouting(scope: HookScope) {
      const { opts: { excludePages = [] } } = scope;
      const pageName = getPageName(scope);
      // 需要排除的页面
      is404 = ExcludePages.concat(excludePages).indexOf(pageName) === -1;
      // 返回false将阻止routing
      return undefined;
    },
  };
};

hook404.hookName = '404';

export default hook404;
