import { HookDescRunnerParam, HookDesc, HookOpts, UsingHookOpts } from '../type';

export interface HookLoadingOpts extends HookOpts {
  element: any;
}

const hookLoadingDesc: HookDesc<HookLoadingOpts> = {
  hookName: 'loading',
  async beforeLoad({ getRender, opts: { element } }: HookDescRunnerParam<HookLoadingOpts>) {
    if (!element) {
      return;
    }

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

const hookLoading: UsingHookOpts<HookLoadingOpts> = {
  hookName: 'loading',
  hookDesc: hookLoadingDesc,
};

export default hookLoading;
