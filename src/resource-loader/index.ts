import { HookScope } from '../hooks/type';

declare global {
  interface Window {
    System: {
      import: (id: string) => Promise<any>;
      delete: (id: string) => boolean;
    };
  }
}

export type Resource = string | Promise<any>;

export interface ResourceLoader {
  mount: (
    resource: Resource,
    // 沙箱从scope上获取，由Base创建
    activeScope: HookScope<any>,
    opts?: { useSystem?: boolean }
  ) => Promise<any>;
  unmount: (
    resource: Resource,
    activeScope: HookScope<any>,
    opts?: { useSystem?: boolean }
  ) => Promise<any>;
}

export const DefaultResourceLoader: ResourceLoader = {
  async mount(
    resource: Resource,
    activeScope: HookScope<any>,
    opts: { useSystem?: boolean } = {}
  ) {
    const { context = window } = activeScope;
    const { useSystem } = opts;

    if (typeof resource === 'string') {
      if (resource.indexOf('.js') > -1) {
        if (useSystem) {
          return context.System ? context.System.import(resource) : {};
        }

        return new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = resource;
          script.onload = resolve;
          script.onerror = reject;

          document.querySelector('head').appendChild(script);
        });
      }

      if (resource.indexOf('.css') > -1) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = resource;

        document.querySelector('head').appendChild(link);

        return;
      }
    }

    return resource;
  },

  async unmount(
    resource: Resource,
    activeScope: HookScope<any>,
    opts: { useSystem?: boolean } = {}
  ) {
    const { context = window } = activeScope;
    const { useSystem } = opts;

    if (typeof resource === 'string') {
      const head = document.querySelector('head');

      if (resource.indexOf('.js') > -1) {
        if (useSystem) {
          context.System && context.System.delete(resource);
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
