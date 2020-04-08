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

declare global {
  interface Window {
    System: {
      import: (id: string) => Promise<any>;
      delete: (id: string) => boolean;
    };
  }
}

function loadScript(url: string) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.crossOrigin = 'anonymous';
    script.onload = resolve;
    script.onerror = reject;

    document.querySelector('head').appendChild(script);
  });
}

function loadCss(url: string) {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.onload = resolve;
    link.onerror = reject;

    document.querySelector('head').appendChild(link);
  });
}

let pLoadSystem;
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
    const { useSystem } = opts;

    if (typeof resource === 'string') {
      if (resource.indexOf('.js') > -1) {
        if (useSystem) {
          let System;
          if (root.System && root.System.import) {
            System = root.System;
          } else {
            System = await getSystem();
          }
          return System.import(resource);
        }

        return loadScript(resource);
      }

      if (resource.indexOf('.css') > -1) {
        return loadCss(resource);
      }
    }

    if (typeof resource === 'function') {
      return resource();
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

    if (typeof resource === 'string') {
      const head = document.querySelector('head');

      if (resource.indexOf('.js') > -1) {
        if (useSystem) {
          root.System && root.System.delete(resource);
          return;
        }

        const script = head.querySelector(`[src="${resource}"]`);
        head.removeChild(script);
        return;
      }

      if (resource.indexOf('.css') > -1) {
        const link = head.querySelector(`[rel="stylesheet"][href="${resource}"]`);
        head.removeChild(link);
      }
    }
  },
};

export const DefaultResourceLoader: ResourceLoader = {
  desc: DefaultResourceLoaderDesc,
};
