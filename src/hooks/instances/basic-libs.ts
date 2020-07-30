/**
 * 加载基础库，每个scope只需要加载一次，在scope变化时需要移除
 * 基础库在路由切换前加载和移除
 *
 * JS沙箱是级联式沙箱，当前沙箱没有对象则会向上级查找，需阻止修改对象的值(用proxy拦截)
 * 写入则只能写在当前JS沙箱里
 */
import { HookDesc, HookDescRunnerParam, HookOpts, UsingHookOpts, Resource } from '@saasfe/we-app-types';
import { isAncestorScope, resourcePreloader, ResourcePreloader } from '@saasfe/we-app-utils';

export interface HookBasicLibsOpts extends HookOpts {
  // 需要加载的资源列表
  url: Resource[];
  // 是否使用systemjs加载
  useSystem?: boolean;
  // 资源加载后的处理
  afterLoad?: () => Promise<any>;
  [prop: string]: any;
}

function getBasicLibsConfig(param: HookDescRunnerParam<HookBasicLibsOpts>) {
  const { hookScope, opts } = param;

  const { desc: resourceLoader, config: resourceLoaderOpts } = hookScope.getResourceLoader();
  const basicLibs = opts.url;
  const { useSystem } = opts;

  return {
    hookScope,
    basicLibs,
    resourceLoader,
    resourceLoaderOpts: {
      ...resourceLoaderOpts,
      useSystem,
    },
    opts,
  };
}

const hookBasicLibsDesc: HookDesc<HookBasicLibsOpts> = {
  beforeRouting: {
    exec: async (param: HookDescRunnerParam<HookBasicLibsOpts>) => {
      // 加载当前scope的基础库
      const { hookScope, resourceLoaderOpts, basicLibs, resourceLoader, opts } = getBasicLibsConfig(param);

      if (!hookScope.getData('basicLibsLoaded')) {
        hookScope.setData('basicLibsLoaded', true);
        // 资源预加载
        basicLibs.forEach((resource, i) => {
          resourcePreloader(resource, ResourcePreloader.preload);
        });
        // 加载静态资源
        await basicLibs.reduce<Promise<any>>((p, r) => {
          return p.then(() => {
            // console.log('basicLibs before', r);
            resourceLoader.mount(r, param.pageScope, resourceLoaderOpts);
            // console.log('basicLibs after', r);
          });
        }, Promise.resolve());
        // 资源加载后的处理
        await opts?.afterLoad?.();
      }
    },
    clear: async (param: HookDescRunnerParam<HookBasicLibsOpts>) => {
      // scope发生变化时，卸载上一个scope的基础库
      const { hookScope, nextHookDescRunnerParam } = param;
      const { hookScope: nextHookScope } = nextHookDescRunnerParam;
      // nextHookScope与当前hookScope是父子关系，不清除
      if (!nextHookScope || !isAncestorScope(hookScope, nextHookScope)) {
        const { basicLibs, resourceLoader, resourceLoaderOpts, hookScope: base } = getBasicLibsConfig(param);
        basicLibs.forEach((r) => {
          resourceLoader.unmount(r, param.pageScope, resourceLoaderOpts);
        });
        base.setData('basicLibsLoaded', false);
      }
    },
  },
};

const hookBasicLibs: UsingHookOpts<HookBasicLibsOpts> = {
  hookName: 'basicLibs',
  hookDesc: hookBasicLibsDesc,
  config: {
    url: [],
    useSystem: false,
  },
};

export default hookBasicLibs;
