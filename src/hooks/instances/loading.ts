import { Hook, HookScope } from '../type';

export interface HookLoadingOpts {
  element: any;
}

const hookLoading: Hook<HookLoadingOpts> = function () {
  return {
    async beforeLoad({ render, opts: { element } }: HookScope<HookLoadingOpts>) {
      render?.mount(
        element,
        /* 默认渲染到当前页面对应的容器内 */
      );
    },

    async onError({ page }: HookScope<HookLoadingOpts>) {
      const render = page?.getRender();
      render?.unmount();
    },

    async beforeMount({ render }: HookScope<HookLoadingOpts>) {
      render?.unmount();
      return undefined;
    },
  };
};

hookLoading.hookName = 'loading';

export default hookLoading;
