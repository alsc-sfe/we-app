import { Hook, HookScope } from '../type';

export interface Hook500Opts {
  element: any;
}

const hook500: Hook<Hook500Opts> = function () {
  let is500 = false;
  return {
    page: {
      activityFunction: () => is500,
      render: {
        mount({ productName, weAppName, pageName, page, opts: { element } }: HookScope<Hook500Opts>) {
          const render = page?.getRender();
          render?.mount(
            element,
            { productName, weAppName, pageName }
          );
        },
        unmount() {},
      },
    },

    async beforeRouting() {
      is500 = false;
      return undefined;
    },

    async onError() {
      is500 = true;
    },

    async beforeMount() {
      // 阻止渲染
      return false;
    },
  };
};

hook500.hookName = '500';

export default hook500;
