/**
 * 需要加载的资源有三种
 * 1. 基础库类的，只需要加载一次，在添加变化时需要移除
 * 2. 微应用配置文件
 * 3. 页面资源文件
 * 实际上，所有资源的加载都是在相应的scope上，
 * 当scope匹配时加载，scope不匹配时移除，同skeleton的逻辑
 */
import { Hook, HookScope } from '../type';

export type Resource = string | Promise<any>;

export type ResourceLoader = (resource: Resource) => Promise<any>;

export interface HookResourceOpts {
  resourceLoader: ResourceLoader;
  basicLib: string[];
  url: string[];
  [prop: string]: any;
}

async function DefaultResourceLoader(resource: Resource) {
  if (typeof resource === 'string') {
    if (resource.indexOf('.js') > -1) {
      const script = document.createElement('script');
      script.src = resource;
      document.querySelector('head').appendChild(script);
      return script;
    }
    if (resource.indexOf('.css') > -1) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = resource;
      document.querySelector('head').appendChild(link);
      return link;
    }
  }

  return resource;
}

const hookResource: Hook<HookResourceOpts> = () => {
  let lastScope: HookScope<HookResourceOpts>;

  return {
    async beforeRouting(scope: HookScope<HookResourceOpts>) {


      return undefined;
    },
  };
};

hookResource.hookName = 'resource';

export default hookResource;
