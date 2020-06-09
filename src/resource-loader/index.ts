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
import { isObj, isFunction, isString } from '../utils/util';

declare global {
  interface Window {
    System: {
      import: (id: string) => Promise<any>;
      delete: (id: string) => boolean;
      [prop: string]: any;
    };
  }
}

export type ResourceFunction = () => Promise<any>;
// 参照tc39 proposal-import-attributes
export type Resource = string | Promise<any> | ResourceFunction | [string, { with: { type: string } }];

export interface ResourceLoaderDesc<ResourceLoaderDescOpts> {
  mount: (
    resource: Resource|Resource[],
    // 沙箱从scope上获取，由Base创建
    activeScope: HookScope,
    opts?: ResourceLoaderDescOpts
  ) => Promise<any>;
  unmount: (
    resource: Resource|Resource[],
    activeScope: HookScope,
    opts?: ResourceLoaderDescOpts
  ) => Promise<any>;
}

export interface ResourceLoader<ResourceLoaderDescOpts> {
  desc?: ResourceLoaderDesc<ResourceLoaderDescOpts>;
  config?: ResourceLoaderDescOpts;
  scopes?: UsingScope[];
}

export interface ResourceLoaderOpts {
  useSystem?: boolean;
  /**
   * 获取js文件导出入口，例如umd的全局变量
   */
  getEntry?: (module: any, resourec: Resource, activeScope: HookScope) => any;
}

const resourceLoader: ResourceLoaderDesc<ResourceLoaderOpts> = {
  async mount(
    resource: Resource,
    activeScope: HookScope,
    opts: ResourceLoaderOpts = { useSystem: true }
  ) {
    const { global = window } = activeScope;
    const { useSystem, getEntry } = opts;

    if (isString(resource)) {
      if ((resource as string).indexOf('.js') > -1) {
        if (useSystem) {
          let System;
          if (global.System && global.System.import) {
            System = global.System;
          } else {
            throw new Error('[we app](Error from resourceLoader)请先引入systemjs');
          }
          const mod = System.import(resource);
          if (isFunction(getEntry)) {
            return mod.then((module: any) => getEntry(module, resource, activeScope));
          }
          return mod;
        }

        const mod = loadScript(resource as string);
        if (isFunction(getEntry)) {
          return mod.then(() => getEntry(null, resource, activeScope));
        }
        return mod;
      }

      if ((resource as string).indexOf('.css') > -1) {
        return loadCSS(resource as string).then(() => undefined);
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
    const { global = window } = activeScope;
    const { useSystem } = opts;

    if (isString(resource)) {
      if ((resource as string).indexOf('.js') > -1) {
        if (useSystem) {
          global.System && global.System.delete(resource as string);
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

const DefaultResourceLoaderDesc: ResourceLoaderDesc<ResourceLoaderOpts> = {
  async mount(
    resource: Resource[],
    activeScope: HookScope,
    opts: ResourceLoaderOpts = { useSystem: true }
  ) {
    let url = resource;
    if (!Array.isArray(resource)) {
      url = [resource];
    }
    const mountedUrl = url.map((r) => {
      return resourceLoader.mount(r, activeScope, opts);
    });
    // 获取第一个不为空的返回值
    const component = await Promise.all(mountedUrl).then((coms) => {
      const com = coms.find((r) => r);
      return com;
    }).then((com: any) => com?.default || com);

    return component;
  },

  async unmount(
    resource: Resource[],
    activeScope: HookScope,
    opts: ResourceLoaderOpts = { useSystem: true }
  ) {
    let url = resource;
    if (!Array.isArray(resource)) {
      url = [resource];
    }
    return url.map((r) => {
      return resourceLoader.unmount(r, activeScope, opts);
    });
  },
};

export const DefaultResourceLoader: ResourceLoader<ResourceLoaderOpts> = {
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
