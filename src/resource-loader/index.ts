/**
 * 这里依赖的System从window底下取，原因有两个：
 * 1. CRM的基础库依赖systemjs，如react、antd等的system module
 * 2. import systemjs仍然会注册到window底下，可能造成全局污染
 *
 * 解决办法：
 * 1. 全局手动引入，部署多一步
 * 2. 默认resourceLoader内置systemjs依赖，可能造成全局污染
 */
import { HookScope, UsingScope } from '../hooks/type';
import { loadScript, loadCSS, removeScript, removeCSS, checkWhile } from './helper';
import { isObj, isFunction, isString } from '../util';

declare global {
  interface Window {
    System: {
      import: (id: string) => Promise<any>;
      delete: (id: string) => boolean;
      [prop: string]: any;
    };
  }
}

let pLoadSystem: Promise<any>;
export async function getSystem() {
  if (!(window.System && window.System.import) && !pLoadSystem) {
    pLoadSystem = loadScript('https://gw.alipayobjects.com/os/lib/systemjs/6.2.5/dist/system.min.js');
  }

  await pLoadSystem;

  return window.System;
}

export type ResourceFunction = () => Promise<any>;
export type Resource = string | Promise<any> | ResourceFunction;

export interface ResourceLoaderOpts {
  useSystem?: boolean;
  /**
   * 获取js文件导出入口，例如umd的全局变量
   */
  getEntry?: (module: any, resourec: Resource, activeScope: HookScope) => any;
}

export interface ResourceLoaderDesc {
  mount: (
    resource: Resource,
    // 沙箱从scope上获取，由Base创建
    activeScope: HookScope,
    opts?: ResourceLoaderOpts
  ) => Promise<any>;
  unmount: (
    resource: Resource,
    activeScope: HookScope,
    opts?: ResourceLoaderOpts
  ) => Promise<any>;
}

export interface ResourceLoader {
  desc?: ResourceLoaderDesc;
  config?: ResourceLoaderOpts;
  scopes?: UsingScope[];
}

const DefaultResourceLoaderDesc: ResourceLoaderDesc = {
  async mount(
    resource: Resource,
    activeScope: HookScope,
    opts: ResourceLoaderOpts = { useSystem: true }
  ) {
    const { root = window } = activeScope;
    const { useSystem, getEntry } = opts;

    if (isString(resource)) {
      if ((resource as string).indexOf('.js') > -1) {
        if (useSystem) {
          let System;
          if (root.System && root.System.import) {
            System = root.System;
          } else {
            System = await getSystem();
          }
          const mod = System.import(resource);
          if (isFunction(getEntry)) {
            return mod.then((module: any) => getEntry(module, resource, activeScope));
          }
          return mod;
        }

        const mod = loadScript(resource as string);
        if (isFunction(getEntry)) {
          return mod.then((module: any) => getEntry(null, resource, activeScope));
        }
        return mod;
      }

      if ((resource as string).indexOf('.css') > -1) {
        return loadCSS(resource as string);
      }
    }

    if (isFunction(resource)) {
      return (resource as Function)();
    }

    return resource;
  },

  async unmount(
    resource: Resource,
    activeScope: HookScope,
    opts: ResourceLoaderOpts = { useSystem: true }
  ) {
    const { root = window } = activeScope;
    const { useSystem } = opts;

    if (isString(resource)) {
      if ((resource as string).indexOf('.js') > -1) {
        if (useSystem) {
          root.System && root.System.delete(resource as string);
          return;
        }

        removeScript(resource as string);
        return;
      }

      if ((resource as string).indexOf('.css') > -1) {
        removeCSS(resource as string);
      }
    }
  },
};

export const DefaultResourceLoader: ResourceLoader = {
  desc: DefaultResourceLoaderDesc,
  config: {
    useSystem: true,
    getEntry(module: any, _resource: Resource, activeScope: HookScope) {
      // 为 System Module，则返回模块内容
      if (isObj(module, '[object Module]')) {
        return module.default || module;
      }
      // 有值但不是事件
      if (module && !(module instanceof Event)) {
        return module;
      }
      // 取全局变量
      const { appName, pageName } = activeScope;
      if (appName && pageName) {
        const argName = `__weapp__${appName.replace(/-/g, '_')}__${pageName.replace(/-/g, '_')}`;
        return checkWhile(() => window[argName]).then(() => {
          const mod = window[argName];
          if (mod) {
            return mod;
          }
        });
      }
    },
  },
};
