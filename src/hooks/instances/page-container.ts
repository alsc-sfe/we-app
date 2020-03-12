/**
 * 骨架必须在路由切换前确定是显示还是隐藏
 * 页面容器在路由切换前显示，在卸载后隐藏
 */
import { HookDesc, HookDescRunnerParam, HookOpts, UsingHookOpts } from '../type';

export interface HookPageContainerOpts extends HookOpts {
  createPageContainer: (param: HookDescRunnerParam<HookPageContainerOpts>) => Element;
  skeletonSelector?: string;
  contentSelector?: string;
  specialSelectors?: { [scopeName: string]: string };
  [prop: string]: any;
}

function DefaultCreatePageContainer(param: HookDescRunnerParam<HookPageContainerOpts>) {
  if (!param.pageScope.pageName) {
    return;
  }

  const { hookScope } = param;
  const elSkeleton: Element = hookScope.getData('skeletonContainer', true) || document.body;
  if (elSkeleton) {
    const { specialSelectors = {} } = param.opts;
    const { productName = '', weAppName = '', pageName = '' } = param.pageScope;

    const pageContainerId = [productName, weAppName, pageName].filter(n => n).join('__');
    const selector = specialSelectors[pageContainerId];
    let elPageContainer = selector && elSkeleton.querySelector(selector);

    if (!elPageContainer) {
      const elContent = hookScope.getData('contentContainer', true) || document.body;
      if (elContent) {
        elPageContainer = document.createElement('div');
        elPageContainer.id = pageContainerId;
        elContent.appendChild(elPageContainer);
      }
    }

    return elPageContainer;
  }
}

const hookPageContainerDesc: HookDesc<HookPageContainerOpts> = {
  hookName: 'pageContainer',

  async beforeLoad(param: HookDescRunnerParam<HookPageContainerOpts>) {
    // 生成页面容器，容器存储到scope中
    const { opts: { createPageContainer }, pageScope } = param;

    if (!createPageContainer) {
      return;
    }

    let elPageContainer = pageScope?.getPageContainer();
    if (!elPageContainer) {
      elPageContainer = createPageContainer(param);
      if (elPageContainer) {
        pageScope?.setPageContainer(elPageContainer);
      }
    }
  },

  async beforeMount(param: HookDescRunnerParam<HookPageContainerOpts>) {
    const { pageScope } = param;

    const elPageContainer = pageScope?.getPageContainer();
    if (elPageContainer) {
      (elPageContainer as HTMLElement).style.display = '';
    }
  },

  async onMountPrevented(param: HookDescRunnerParam<HookPageContainerOpts>) {
    // 隐藏页面容器
    const { pageScope } = param;

    const elPageContainer = pageScope?.getPageContainer();
    if (elPageContainer) {
      (elPageContainer as HTMLElement).style.display = 'none';
    }
  },

  async afterUnmount(param: HookDescRunnerParam<HookPageContainerOpts>) {
    // 隐藏页面容器
    const { pageScope } = param;

    const elPageContainer = pageScope?.getPageContainer();
    if (elPageContainer) {
      (elPageContainer as HTMLElement).style.display = 'none';
    }
  },

  async onError(param: HookDescRunnerParam<HookPageContainerOpts>) {
    // 隐藏页面容器
    const { pageScope } = param;

    const elPageContainer = pageScope?.getPageContainer();
    if (elPageContainer) {
      (elPageContainer as HTMLElement).style.display = 'none';
    }
  },
};

const hookPageContainer: UsingHookOpts<HookPageContainerOpts> = {
  hookName: 'pageContainer',
  hookDesc: hookPageContainerDesc,
  config: {
    createPageContainer: DefaultCreatePageContainer,
  },
};

export default hookPageContainer;
