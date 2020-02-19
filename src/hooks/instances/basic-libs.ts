/**
 * 加载基础库，每个scope只需要加载一次，在scope变化时需要移除
 * 基础库在路由切换前加载和移除
 *
 * JS沙箱是级联式沙箱，当前沙箱没有对象则会向上级查找，需阻止修改对象的值(用proxy拦截)
 * 写入则只能写在当前JS沙箱里
 */
import { Hook, HookScope } from '../type';
import { DefaultResourceLoader, Resource, ResourceLoader } from '../../resource-loader';
import { isAncestorScope, checkUseSystem } from '../../helpers';

export interface HookBasicLibsOpts {
  [prop: string]: any;
}

function getBasicLibsConfig(scope: HookScope<HookBasicLibsOpts>) {
  const { enabledScope } = scope;
  const { product, weApp, page } = enabledScope || {};

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

const hookBasicLibs: Hook<HookBasicLibsOpts> = () => {
  let lastScope: HookScope<HookBasicLibsOpts>;

  return {
    async beforeRouting(scope: HookScope<HookBasicLibsOpts>) {
      // scope发生变化时，卸载上一个scope的基础库
      if (lastScope) {
        // lastScope与当前scope是父子关系，不清除
        if (!isAncestorScope(lastScope.enabledScope, scope.enabledScope)) {
          const lastBasicLibsConfig = getBasicLibsConfig(lastScope);
          lastBasicLibsConfig.basicLibs.forEach((r) => {
            lastBasicLibsConfig.resourceLoader.unmount(r, scope, { useSystem: lastBasicLibsConfig.useSystem });
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
      const basicLibsConfig = getBasicLibsConfig(scope);

      if (!basicLibsConfig.base.getData('basicLibs')) {
        await basicLibsConfig.basicLibs.reduce(async (p, r) => {
          await p;
          return basicLibsConfig.resourceLoader.mount(r, scope, { useSystem: basicLibsConfig.useSystem });
        }, Promise.resolve());

        basicLibsConfig.base.setData({
          basicLibs: true,
        });

        if (lastScope) {
          scope.lastScope = scope;
        }
        lastScope = scope;
      }

      return undefined;
    },
  };
};

hookBasicLibs.hookName = 'basicLibs';

export default hookBasicLibs;
