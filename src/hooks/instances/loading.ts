import { HookDescRunnerParam, HookDesc } from '../type';

export interface HookLoadingOpts {
  element: any;
}

const hookLoading: HookDesc<HookLoadingOpts> = {
  hookName: 'loading',
  async beforeLoad({ getRender, opts: { element } }: HookDescRunnerParam<HookLoadingOpts>) {
    const render = getRender();
    render?.mount(
      element,
      /* 默认渲染到当前页面对应的容器内 */
    );
  },

  async onError({ getRender }: HookDescRunnerParam<HookLoadingOpts>) {
    const render = getRender();
    render?.unmount();
  },

  async beforeMount({ getRender }: HookDescRunnerParam<HookLoadingOpts>) {
    const render = getRender();
    render?.unmount();
  },
};

export default hookLoading;
