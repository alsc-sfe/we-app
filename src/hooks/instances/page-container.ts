/**
 * 骨架必须在路由切换前确定是显示还是隐藏
 * 页面容器在路由切换前显示，在卸载后隐藏
 */
import { HookDesc, HookDescRunnerParam, HookOpts, UsingHookOpts, TPageContainer, ContainerSelector } from '@saasfe/we-app-types';
import { getElement, isValidElement } from '@saasfe/we-app-utils';

export interface HookPageContainerOpts extends HookOpts {
  createPageContainer: (param: HookDescRunnerParam<HookPageContainerOpts>) => TPageContainer;
  skeletonContainer?: ContainerSelector;
  contentContainer?: ContainerSelector;
  specialSelectors?: { [scopeName: string]: string };
}

function DefaultCreatePageContainer(param: HookDescRunnerParam<HookPageContainerOpts>) {
  if (!param.pageScope.pageName) {
    return;
  }

  const { hookScope } = param;
  const { skeletonContainer } = param.opts;
  const elSkeleton: HTMLElement = hookScope.getData('skeletonContainer', true) ||
    getElement(skeletonContainer);
  if (isValidElement(elSkeleton)) {
    const { specialSelectors = {}, contentContainer } = param.opts;
    const { productName = '', appName = '', pageName = '' } = param.pageScope;

    const pageContainerId = [productName, appName, pageName].filter(n => n).join('__');
    const selector = specialSelectors[pageContainerId];
    let elPageContainer: HTMLElement = selector && elSkeleton.querySelector(selector);

    if (!isValidElement(elPageContainer)) {
      elPageContainer = elSkeleton.querySelector('#' + pageContainerId);
    }

    if (!isValidElement(elPageContainer)) {
      const elContent = hookScope.getData('contentContainer', true) ||
        getElement(contentContainer, elSkeleton) || elSkeleton;
      if (isValidElement(elContent)) {
        elPageContainer = document.createElement('div');
        elPageContainer.id = pageContainerId;
        elContent.appendChild(elPageContainer);
      }
    }

    return elPageContainer;
  }
}

function createAndStorePageContainer(param: HookDescRunnerParam<HookPageContainerOpts>) {
  // 生成页面容器，容器存储到scope中
  const { opts: { createPageContainer }, pageScope } = param;

  let elPageContainer: HTMLElement = pageScope?.getPageContainer?.();
  if (!isValidElement(elPageContainer) && createPageContainer) {
    elPageContainer = createPageContainer(param);
  }

  if (!isValidElement(elPageContainer)) {
    elPageContainer = null;
  }

  pageScope?.setPageContainer?.(elPageContainer);

  return elPageContainer;
}

const hookPageContainerDesc: HookDesc<HookPageContainerOpts> = {
  async beforeRouting(param: HookDescRunnerParam<HookPageContainerOpts>) {
    // 生成页面容器，容器存储到scope中
    createAndStorePageContainer(param);
  },

  async beforeLoad(param: HookDescRunnerParam<HookPageContainerOpts>) {
    const elPageContainer = createAndStorePageContainer(param);

    if (isValidElement(elPageContainer)) {
      elPageContainer.style.display = '';
    }
  },

  async beforeMount(param: HookDescRunnerParam<HookPageContainerOpts>) {
    const elPageContainer = createAndStorePageContainer(param);

    if (isValidElement(elPageContainer)) {
      elPageContainer.style.display = '';
    }
  },

  async onMountPrevented(param: HookDescRunnerParam<HookPageContainerOpts>) {
    // 隐藏页面容器
    const elPageContainer = createAndStorePageContainer(param);

    if (isValidElement(elPageContainer)) {
      elPageContainer.style.display = 'none';
    }
  },

  async afterUnmount(param: HookDescRunnerParam<HookPageContainerOpts>) {
    // 隐藏页面容器
    const elPageContainer = createAndStorePageContainer(param);

    if (isValidElement(elPageContainer)) {
      elPageContainer.style.display = 'none';
    }
  },

  async onError(param: HookDescRunnerParam<HookPageContainerOpts>) {
    // 隐藏页面容器
    const elPageContainer = createAndStorePageContainer(param);

    if (isValidElement(elPageContainer)) {
      elPageContainer.style.display = 'none';
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
