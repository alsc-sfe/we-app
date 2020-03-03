import { HookDescRunnerParam, HookDesc } from '../type';

export interface HookLoadingOpts {
  element: any;
}

const hookLoading: HookDesc<HookLoadingOpts> = {
  hookName: 'loading',
  async beforeLoad({ render, opts: { element } }: HookDescRunnerParam<HookLoadingOpts>) {
    render?.mount(
      element,
      /* 默认渲染到当前页面对应的容器内 */
    );
  },

  async onError({ pageScope: { page } }: HookDescRunnerParam<HookLoadingOpts>) {
    const render = page?.getRender();
    render?.unmount();
  },

  async beforeMount({ render }: HookDescRunnerParam<HookLoadingOpts>) {
    render?.unmount();
  },
};

export default hookLoading;
