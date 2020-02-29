import { getPageName } from '../../helpers';
import { Hook, HookScope } from '../type';

export interface Hook403Opts {
  element: any;
  excludePages: string[];
  check403: (pageAuthCode: string) => Promise<boolean>;
  [prop: string]: any;
}

const hook403: Hook<Hook403Opts> = () => {
  let is403 = false;

  return {
    page: {
      activityFunction: () => is403,
      render: {
        // 已经进入页面渲染环节，需要拿到需要渲染的对象
        mount(_component, container, { weApp, page }) {
          // 获得原始的渲染函数
          // 从weApp取，而不是page，因为
          // 当前页面对应render就是hook.page.render
          const render = weApp?.getRender();
          const Component = page?.getConfig('403');
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

    async beforeRouting(scope: HookScope<Hook403Opts>) {
      const { opts: { excludePages = [] }, hookPages = [] } = scope;
      const pageName = getPageName(scope);
      // 从当前路由解析出当前激活的页面
      if (hookPages.concat(excludePages).indexOf(pageName) === -1) {
        const { page } = scope;
        // 获取当前页面对应的权限码
        if (page) {
          const { opts: { check403 } } = scope;
          const pageAuthCode = page.getConfig('pageAuth.pageAuthCode');
          is403 = await check403(pageAuthCode);
        }
      }

      return undefined;
    },

    async beforeMount() {
      // 阻止渲染
      return !is403;
    },
  };
};

hook403.hookName = '403';

export default hook403;
