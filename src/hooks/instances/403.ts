import { getPageName } from '../../helpers';
import { Hook } from '../type';
import Page from '../../weapp/page';

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

const hook403: Hook<Hook403Opts> = function ({ element, excludePages = [], check403 }) {
  let is403 = false;
  return {
    page: {
      activityFunction: () => is403,
      render: {
        mount({ productName, weAppName, pageName, render }) {
          render.mount(
            element,
            { productName, weAppName, pageName }
          );
        },
        unmount() {},
      },
    },

    async beforeRouting({ activePages, getScope }) {
      // 从当前路由解析出当前激活的页面
      const pageName = activePages.find((pname: string) => ExcludePages.concat(excludePages).indexOf(pname) === -1);
      if (pageName) {
        const page = getScope(pageName).page as Page;
        // 获取当前页面对应的权限码
        if (page) {
          const pageAuthCode = page.getConfig('pageAuth.pageAuthCode');
          is403 = await check403(pageAuthCode);
        }
      }

      return undefined;
    },

    async beforeRender() {
      // 阻止渲染
      return !is403;
    },
  };
};

hook403.hookName = '403';

export default hook403;
