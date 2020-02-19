import { getPageName } from '../../helpers';
import { Hook, HookScope } from '../type';

const ExcludePages = [
  getPageName({
    hookName: '404',
  }),
  getPageName({
    hookName: '403',
  }),
  getPageName({
    hookName: '500',
  }),
];

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
      hooks: false,
      render: {
        // 已经进入页面渲染环节，需要拿到需要渲染的对象
        mount({ productName, weAppName, pageName, page, opts: { element } }) {
          const render = page?.getRender();
          render?.mount(
            element,
            { productName, weAppName, pageName }
          );
        },
        unmount() {},
      },
    },

    async beforeRouting(scope: HookScope<Hook403Opts>) {
      const { opts: { excludePages = [] } } = scope;
      const pageName = getPageName(scope);
      // 从当前路由解析出当前激活的页面
      if (ExcludePages.concat(excludePages).indexOf(pageName) === -1) {
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
