import { HookDesc } from '../type';

export interface Hook500Opts {
  element: any;
}

let is500 = false;

const hook500: HookDesc<Hook500Opts> = {
  hookName: '500',
  page: {
    activityFunction: () => is500,
    render: {
      mount(_component, container, { weApp, page }) {
        // 获得原始的渲染函数
        // 从weApp取，而不是page，因为
        // 当前页面对应render就是hook.page.render
        const render = weApp?.getRender();
        const Component = page?.getConfig('500');
        if (Component) {
          render?.mount(
            Component,
            container,
          );
        }
      },
      unmount(container, { weApp }) {
        const render = weApp?.getRender();
        render?.unmount(container);
      },
    },
  },

  async beforeRouting() {
    is500 = false;
  },

  async onError() {
    is500 = true;
  },

  async beforeMount() {
    // 阻止渲染
    return false;
  },
};

export default hook500;
