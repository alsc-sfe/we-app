import { HookDescRunnerParam, HookDesc, HookOpts, UsingHookOpts } from '../type';

export interface HookLoadingOpts extends HookOpts {
  element: any;
}

const hookLoadingDesc: HookDesc<HookLoadingOpts> = {
  hookName: 'loading',
  async beforeLoad({ pageScope, opts: { element } }: HookDescRunnerParam<HookLoadingOpts>) {
    if (!element) {
      return;
    }

    const render = pageScope?.getRender();
    render?.mount(
      element,
      /* 默认渲染到当前页面对应的容器内 */
    );
  },

  async onError({ pageScope }: HookDescRunnerParam<HookLoadingOpts>) {
    const render = pageScope?.getRender();
    render?.unmount();
  },

  async beforeMount({ pageScope }: HookDescRunnerParam<HookLoadingOpts>) {
    const render = pageScope?.getRender();
    render?.unmount();
  },
};

const hookLoading: UsingHookOpts<HookLoadingOpts> = {
  hookName: 'loading',
  hookDesc: hookLoadingDesc,
};

export default hookLoading;
