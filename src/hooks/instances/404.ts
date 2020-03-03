/**
 * 404的判断方式：
 * 1. singleSpa里有页面，但是没有匹配到
 * 2. 匹配到的页面全部被排除了
 */
import { getScopeName } from '../../helpers';
import { HookDesc, HookDescRunnerParam } from '../type';

export interface Hook404Opts {
  element: any;
  excludePages?: string[];
}

let is404 = false;

const hook404: HookDesc<Hook404Opts> = {
  hookName: '404',
  page: {
    hooks: ['pageContainer'],
    activityFunction: () => is404,
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

  async beforeRouting(param: HookDescRunnerParam<Hook404Opts>) {
    const { opts: { excludePages = [] }, activePageScopes = [], hookPages = [] } = param;
    const exPages = hookPages.concat(excludePages);
    console.log(param.pageScope.scopeName, param.hookScope.scopeName, param);
    const activePages = activePageScopes.map((activeScope) => {
      return getScopeName(activeScope);
    }).filter((activePage) => {
      return exPages.indexOf(activePage) === -1;
    });
    // 需要排除的页面
    is404 = activePages.length === 0;
  },
};

export default hook404;
