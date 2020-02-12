import { Hook } from '../type';

export interface Hook500Opts {
  element: any;
}

const hook500: Hook<Hook500Opts> = function () {
  let is500 = false;
  return {
    page: {
      activityFunction: () => is500,
      render: {
        mount({ productName, weAppName, pageName, render, opts: { element } }) {
          render.mount(
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

    async beforeRender() {
      // 阻止渲染
      return false;
    },
  };
};

hook500.hookName = '500';

export default hook500;
