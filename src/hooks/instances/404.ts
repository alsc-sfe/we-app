/**
 * 404的判断方式：
 * 1. singleSpa里有页面，但是没有匹配到
 * 2. 匹配到的页面全部被排除了
 */
import { getScopeName } from '../../helpers';
import { HookDesc, HookDescRunnerParam, HookOpts } from '../type';

export interface Hook404Opts extends HookOpts {
  excludePages?: string[];
}

let is404 = false;

const hook404: HookDesc<Hook404Opts> = {
  hookName: '404',
  page: {
    hooks: ['pageContainer', '500'],
    activityFunction: () => is404,
  },

  async beforeRouting(param: HookDescRunnerParam<Hook404Opts>) {
    const { opts: { excludePages = [] }, activePages = [], hookPages = [] } = param;
    const exPages = hookPages.concat(excludePages);

    const alivePages = activePages.filter((activePage) => {
      return exPages.indexOf(activePage) === -1;
    });
    is404 = alivePages.length === 0;
  },
};

export default hook404;
