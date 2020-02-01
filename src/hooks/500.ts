import { Hook } from './type';

export interface Hook500Opts {
  element: any;
}

const hook500: Hook<Hook500Opts> = function ({ element }) {
  let is500 = false;
  return {
    page: {
      activityFunction: () => is500,
      render({ productName, weAppName, pageName, render }) {
        render.mount(
          element,
          { productName, weAppName, pageName }
        );
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
