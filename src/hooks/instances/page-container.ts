/**
 * 骨架必须在路由切换前确定是显示还是隐藏
 * 页面容器在路由切换前显示，在卸载后隐藏
 */
import { HookDesc, HookDescRunnerParam } from '../type';

export interface HookSkeletonOpts {
  skeleton: string;
  container: HTMLElement;
  contentSelector: string;
  [prop: string]: any;
}

function DefaultGetPageContainer(param: HookDescRunnerParam<HookSkeletonOpts>) {
  if (!param.pageScope.page) {
    return;
  }

  const { product, weApp, page } = param.hookScope;
  const base = page || weApp || product;
  const elSkeleton: Element = base.getSkeletonContainer(true);
  if (elSkeleton) {
    const { opts: { contentSelector = '.__weapp__content' } } = param;
    const { productName = '', weAppName = '', pageName = '' } = param.pageScope;

    const pageContainerId = [productName, weAppName, pageName].join('__');
    let elPageContainer = elSkeleton.querySelector(`#${pageContainerId}`);

    if (!elPageContainer) {
      const elContent = elSkeleton.querySelector(contentSelector);
      if (elContent) {
        elPageContainer = document.createElement('div');
        elPageContainer.id = pageContainerId;
        elContent.appendChild(elPageContainer);
      }
    }

    return elPageContainer;
  }
}

const hookPageContainer: HookDesc<HookSkeletonOpts> = {
  hookName: 'pageContainer',

  async beforeLoad(param: HookDescRunnerParam<HookSkeletonOpts>) {
    // 生成页面容器，容器存储到scope中
    const { opts: { getPageContainer = DefaultGetPageContainer }, pageScope } = param;

    const elPageContainer = getPageContainer(param);
    if (elPageContainer) {
      pageScope.page?.setPageContainer(elPageContainer);
    }
  },

  async beforeMount(param: HookDescRunnerParam<HookSkeletonOpts>) {
    const { page } = param.pageScope;

    const elPageContainer = page.getPageContainer();
    if (elPageContainer) {
      elPageContainer.style.display = '';
    }
  },

  async afterUnmount(param: HookDescRunnerParam<HookSkeletonOpts>) {
    // 隐藏页面容器
    const { page } = param.pageScope;

    const elPageContainer = page.getPageContainer();
    if (elPageContainer) {
      elPageContainer.style.display = 'none';
    }
  },
};

export default hookPageContainer;
