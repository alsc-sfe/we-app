import { getPageName } from '../../helpers';
import { Hook } from '../type';

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

    async beforeRouting({ activePages, opts: { excludePages = [] } }) {
      // 需要排除的页面
      const currentPageNames = activePages.filter((pageName) => ExcludePages.concat(excludePages).indexOf(pageName) === -1);
      is404 = currentPageNames.length === 0;
      // 返回false将阻止routing
      return undefined;
    },
  };
};

hook404.hookName = '404';

export default hook404;
