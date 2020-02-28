/**
 * 404的判断方式：
 * 1. singleSpa里有页面，但是没有匹配到
 * 2. 匹配到的页面全部被排除了
 */
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
      hooks: false,
      render: {
        mount(_component, container, { weApp, page }) {
          // 获得原始的渲染函数
          // 从weApp取，而不是page，因为
          // 当前页面对应render就是hook.page.render
          const render = weApp?.getRender();
          const Component = page?.getConfig('404');
          if (Component) {
            render?.mount(
              Component,
              container,
            );
          }
        },
        unmount(container, { weApp }) {
          const render = weApp?.getRender();
          render?.unmount(container);
        },
      },
    },

    async beforeRouting(scope: HookScope<Hook404Opts>) {
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
