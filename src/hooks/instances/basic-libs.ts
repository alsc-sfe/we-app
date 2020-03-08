/**
 * 加载基础库，每个scope只需要加载一次，在scope变化时需要移除
 * 基础库在路由切换前加载和移除
 *
 * JS沙箱是级联式沙箱，当前沙箱没有对象则会向上级查找，需阻止修改对象的值(用proxy拦截)
 * 写入则只能写在当前JS沙箱里
 */
import { HookScope, HookDesc, HookDescRunnerParam, HookOpts } from '../type';
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

const prevHookDescRunnerParams: HookDescRunnerParam<HookBasicLibsOpts>[] = [];

const hookBasicLibs: HookDesc<HookBasicLibsOpts> = {
  hookName: 'basicLibs',
  beforeRouting: {
    exec: async (param: HookDescRunnerParam<HookBasicLibsOpts>) => {
      // 加载当前scope的基础库
      const { base, useSystem, basicLibs, resourceLoader } = getBasicLibsConfig(param);

      if (!base.getData('basicLibs')) {
        await basicLibs.reduce(async (p, r) => {
          await p;
          return resourceLoader.mount(r, param.pageScope, { useSystem });
        }, Promise.resolve());

        base.setData({
          basicLibs: true,
        });

        prevHookDescRunnerParams.push(param);
      }
    },
    clear: async (param: HookDescRunnerParam<HookBasicLibsOpts>) => {
      // scope发生变化时，卸载上一个scope的基础库
      const prevHookDescRunnerParamsLength = prevHookDescRunnerParams.length;
      if (prevHookDescRunnerParamsLength) {
        // lastScope与当前scope是父子关系，不清除
        const lastHookDescRunnerParam = prevHookDescRunnerParams[prevHookDescRunnerParamsLength - 1];
        if (!isAncestorScope(lastHookDescRunnerParam.hookScope, param.hookScope)) {
          const { basicLibs, resourceLoader, useSystem, base } = getBasicLibsConfig(lastHookDescRunnerParam);
          basicLibs.forEach((r) => {
            resourceLoader.unmount(r, param.pageScope, { useSystem });
          });
          base.setData({
            basicLibs: false,
          });

          prevHookDescRunnerParams.pop();
        }
      }
    },
  },
};

export default hookBasicLibs;
