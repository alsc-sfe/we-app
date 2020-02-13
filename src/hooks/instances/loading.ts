import { Hook } from '../type';

export interface HookLoadingOpts {
  element: any;
}

const hookLoading: Hook<HookLoadingOpts> = function () {
  return {
    async beforeLoad({ render, opts: { element } }) {
      render.mount(
        element,
        /* 默认渲染到当前页面对应的容器内 */
      );
    },

    async onError({ render }) {
      render.unmount();
    },

    async beforeMountRender({ render }) {
      render.unmount();
      return undefined;
    },
  };
};

hookLoading.hookName = 'loading';

export default hookLoading;
