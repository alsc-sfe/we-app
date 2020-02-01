import { getPageName, getPageConfig } from '../helpers';
import { Hook } from './type';

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
      render({ productName, weAppName, pageName, render }) {
        render.mount(
          element,
          { productName, weAppName, pageName }
        );
      },
    },

    async beforeRouting({ activePages }) {
      // 从当前路由解析出当前激活的页面
      // getPageName 获取需要排除的页面对应的页面名称
      const pageName = activePages.filter((pname: string) => ExcludePages.concat(excludePages).indexOf(pname) === -1);
      // 获取当前页面对应的权限码
      const pageAuthCode = getPageConfig(pageName, 'pageAuth.pageAuthCode');

      is403 = await check403(pageAuthCode);

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
