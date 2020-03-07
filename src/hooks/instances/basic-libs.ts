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
  [prop: string]: any;
}

function getBasicLibsConfig(scope: HookScope) {
  const { hookScope } = scope;
  const { product, weApp, page } = hookScope || {};

  const base = page || weApp || product;
  const resourceLoader = base.getConfig('resourceLoader') as ResourceLoader || DefaultResourceLoader;
  const basicLibs = base.getConfig('basicLibs') as Resource[];
  const useSystem = base.getConfig('useSystem') as string[];

  const basicLibUseSystem = checkUseSystem(useSystem, 'basicLibs');

  return {
    base,
    basicLibs,
    resourceLoader,
    useSystem: basicLibUseSystem,
  };
}

let lastScope: HookDescRunnerParam<HookBasicLibsOpts>;

const hookBasicLibs: HookDesc<HookBasicLibsOpts> = {
  hookName: 'basicLibs',
  async beforeRouting(param: HookDescRunnerParam<HookBasicLibsOpts>) {
    // scope发生变化时，卸载上一个scope的基础库
    if (lastScope) {
      // lastScope与当前scope是父子关系，不清除
      if (!isAncestorScope(lastScope.hookScope, param.hookScope)) {
        const lastBasicLibsConfig = getBasicLibsConfig(lastScope);
        lastBasicLibsConfig.basicLibs.forEach((r) => {
          lastBasicLibsConfig.resourceLoader.unmount(r, param.pageScope, { useSystem: lastBasicLibsConfig.useSystem });
        });
        lastBasicLibsConfig.base.setData({
          basicLibs: false,
        });

        if (lastScope.lastScope) {
          lastScope = lastScope.lastScope;
        } else {
          lastScope = null;
        }
      }
    }

    // 加载当前scope的基础库
    const basicLibsConfig = getBasicLibsConfig(param);

    if (!basicLibsConfig.base.getData('basicLibs')) {
      await basicLibsConfig.basicLibs.reduce(async (p, r) => {
        await p;
        return basicLibsConfig.resourceLoader.mount(r, param.pageScope, { useSystem: basicLibsConfig.useSystem });
      }, Promise.resolve());

      basicLibsConfig.base.setData({
        basicLibs: true,
      });

      if (lastScope) {
        param.lastScope = param;
      }
      lastScope = param;
    }
  },
};

export default hookBasicLibs;
