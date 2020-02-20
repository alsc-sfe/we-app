/**
 * 骨架必须在路由切换前确定是显示还是隐藏
 * 页面容器在路由切换前显示，在卸载后隐藏
 */
import { Hook, HookScope } from '../type';

export interface HookSkeletonOpts {
  skeleton: string;
  container: HTMLElement;
  contentSelector: string;
  [prop: string]: any;
}

function DefaultGetPageContainer(scope: HookScope<HookSkeletonOpts>) {
  if (!scope.page) {
    return;
  }

  const { product, weApp, page } = scope.enabledScope;
  const base = page || weApp || product;
  const elSkeleton: Element = base.getSkeletonContainer();
  if (elSkeleton) {
    const { productName = '', weAppName = '', pageName = '',
      opts: { contentSelector = '.__weapp__content' } } = scope;

    const pageContainerId = [productName, weAppName, pageName].join('__');
    let elPageContainer = elSkeleton.querySelector(`#${pageContainerId}`);

    if (!elPageContainer) {
      const elContent = elSkeleton.querySelector(contentSelector);
      if (elContent) {
        elPageContainer = document.createElement('div');
        elContent.appendChild(elPageContainer);
      }
    }

    return elPageContainer;
  }
}

const hookSkeleton: Hook<HookSkeletonOpts> = () => {
  let lastScope: HookScope<HookSkeletonOpts>;

  return {
    async beforeRouting(scope: HookScope<HookSkeletonOpts>) {
      const { enabledScope } = scope;
      // 使用启用scope的级别获取骨架容器
      const base = enabledScope.page || enabledScope.weApp || enabledScope.product;

      // 跨产品时，是否需要隐藏当前skeleton
      // 此处有2个问题，
      // 1. 当是父子关系时，父级不可清除
      // 2. 多个skeleton，lastScope会被覆盖，导致清除不彻底
      //    所以，lastScope使用链式
      if (lastScope) {
        let { opts: { container: lastContainer } } = lastScope;
        const { opts: { contentSelector: lastContentSelector },
          enabledScope: lastEnabledScope } = lastScope;
        const lastBase =
          lastEnabledScope.page || lastEnabledScope.weApp || lastEnabledScope.product;

        const lastSkeleton = lastBase.getSkeletonContainer();
        // 为父子关系不清除
        if (base.getSkeletonContainer(true) !== lastSkeleton) {
          // 需要处理取父骨架的情况，取父骨架的内容区
          if (!lastContainer) {
            // 回溯到父骨架
            lastContainer = lastBase.getSkeletonContainer(true).querySelector(lastContentSelector);
          }
          lastContainer.removeChild(lastSkeleton);
          // lastScope链式回溯
          if (lastScope.lastScope) {
            lastScope = lastScope.lastScope;
          } else {
            lastScope = null;
          }
        }
      }

      // 渲染骨架
      let { opts: { container } } = scope;
      const { opts: { skeleton, contentSelector } } = scope;

      if (!base.getSkeletonContainer()) {
        const div = document.createElement('div');
        div.innerHTML = skeleton;
        const skeletonContainer = div.children[0];

        const df = document.createDocumentFragment();
        df.appendChild(skeletonContainer);

        if (!container) {
          // 回溯到父骨架
          container = base.getSkeletonContainer(true).querySelector(contentSelector);
        }

        container.appendChild(df);

        base.setSkeletonContainer(skeletonContainer);

        // lastScope 形成链式
        if (lastScope) {
          scope.lastScope = lastScope;
        }
        lastScope = scope;
      }

      return undefined;
    },
    async beforeLoad(scope: HookScope<HookSkeletonOpts>) {
      // 生成页面容器，容器存储到scope中
      const { opts: { getPageContainer = DefaultGetPageContainer } } = scope;

      const elPageContainer = getPageContainer(scope);
      if (elPageContainer) {
        scope.page?.setPageContainer(elPageContainer);
      }

      return undefined;
    },
    async afterUmount(scope: HookScope<HookSkeletonOpts>) {
      // 隐藏页面容器
      const { getPageContainer } = scope.page;

      const elPageContainer = getPageContainer();

      elPageContainer.style.display = 'none';
    },
  };
};

hookSkeleton.hookName = 'skeleton';

export default hookSkeleton;
