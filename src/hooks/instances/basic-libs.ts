/**
 * 加载基础库，每个scope只需要加载一次，在scope变化时需要移除
 * 基础库在路由切换前加载和移除
 *
 * JS沙箱是级联式沙箱，当前沙箱没有对象则会向上级查找，需阻止修改对象的值(用proxy拦截)
 * 写入则只能写在当前JS沙箱里
 */
import { HookDesc, HookDescRunnerParam, HookOpts } from '../type';
import { DefaultResourceLoader, Resource, ResourceLoader } from '../../resource-loader';
import { isAncestorScope, checkUseSystem } from '../../helpers';

export interface HookBasicLibsOpts extends HookOpts {
  url: Resource[];
  useSystem: string[];
  [prop: string]: any;
}

function getBasicLibsConfig(scope: HookDescRunnerParam<HookBasicLibsOpts>) {
  const { hookScope, opts } = scope;
  const { product, weApp, page } = hookScope || {};

  const base = page || weApp || product;
  const resourceLoader = base.getConfig('resourceLoader') as ResourceLoader || DefaultResourceLoader;
  const basicLibs = opts.url;
  const useSystem = opts.useSystem || base.getConfig('useSystem') as string[];

  const basicLibUseSystem = checkUseSystem(useSystem, 'basicLibs');

  return {
    base,
    basicLibs,
    resourceLoader,
    useSystem: basicLibUseSystem,
  };
}

const hookBasicLibs: HookDesc<HookBasicLibsOpts> = {
  hookName: 'basicLibs',
  beforeRouting: {
    exec: async (param: HookDescRunnerParam<HookBasicLibsOpts>) => {
      // 加载当前scope的基础库
      const { base, useSystem, basicLibs, resourceLoader } = getBasicLibsConfig(param);

      if (!base.getData('basicLibsLoaded')) {
        await basicLibs.reduce(async (p, r) => {
          await p;
          return resourceLoader.mount(r, param.pageScope, { useSystem });
        }, Promise.resolve());

        base.setData({
          basicLibsLoaded: true,
        });
      }
    },
    clear: async (param: HookDescRunnerParam<HookBasicLibsOpts>) => {
      // scope发生变化时，卸载上一个scope的基础库
      const { hookScope, nextHookDescRunnerParam } = param;
      const { hookScope: nextHookScope } = nextHookDescRunnerParam;
      // nextHookScope与当前hookScope是父子关系，不清除
      if (!nextHookScope || !isAncestorScope(hookScope, nextHookScope)) {
        const { basicLibs, resourceLoader, useSystem, base } = getBasicLibsConfig(param);
        basicLibs.forEach((r) => {
          resourceLoader.unmount(r, param.pageScope, { useSystem });
        });
        base.setData({
          basicLibsLoaded: false,
        });
      }
    },
  },
};

export default hookBasicLibs;
