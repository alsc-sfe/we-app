import { Hook, HookScope } from '../type';

export interface HookSkeletonOpts {
  skeleton: string;
  container: HTMLElement;
  contentSelector: string;
  [prop: string]: any;
}

function DefaultGetPageContainer(elSkeleton: Element, scope: HookScope<HookSkeletonOpts>) {
  if (elSkeleton) {
    const { productName = '', weAppName = '', pageName = '',
      opts: { contentSelector = '.__weapp__content' } } = scope;

    const pageContainerId = [productName, weAppName, pageName].join('__');
    let elPageContainer = elSkeleton.querySelector(`#${pageContainerId}`);

    if (!elPageContainer) {
      const elContent = elSkeleton.querySelector(contentSelector);

      elPageContainer = document.createElement('div');
      // @ts-ignore
      elPageContainer.style.display = 'none';

      elContent.appendChild(elPageContainer);
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
      const { getSkeletonContainer } = enabledScope.page;

      const elSkeleton: Element = getSkeletonContainer();

      if (elSkeleton) {
        // 生成页面容器，容器存储到scope中
        const { opts: { getPageContainer = DefaultGetPageContainer } } = scope;
        const { setPageContainer } = scope.page;

        const elPageContainer = getPageContainer(elSkeleton, scope);
        if (elPageContainer) {
          setPageContainer(elPageContainer);
        }

        return undefined;
      }

      // 跨产品时，是否需要隐藏当前skeleton
      // 此处有2个问题，
      // 1. 当是父子关系时，父级不可清除
      // 2. 多个skeleton，lastScope会被覆盖，导致清除不彻底
      if (lastScope) {
        let { opts: { container: lastContainer } } = lastScope;
        const { opts: { contentSelector: lastContentSelector },
          enabledScope: lastEnabledScope } = lastScope;
        const { getSkeletonContainer: getLastSkeletonContainer } = lastEnabledScope.page;

        const lastSkeleton = getLastSkeletonContainer();
        // 为父子关系不清除
        if (getSkeletonContainer(true) !== lastSkeleton) {
          // 需要处理取父骨架的情况，取父骨架的内容区
          if (!lastContainer) {
            // 回溯到父骨架
            lastContainer = getLastSkeletonContainer(true).querySelector(lastContentSelector);
          }
          lastContainer.removeChild(lastSkeleton);
        }
        // lastScope链式回溯
        if (lastScope.lastScope) {
          lastScope = lastScope.lastScope;
        } else {
          lastScope = null;
        }
      }

      // 渲染骨架
      const { setSkeletonContainer } = enabledScope.page;
      let { opts: { container } } = scope;
      const { opts: { skeleton, contentSelector } } = scope;

      const div = document.createElement('div');
      div.innerHTML = skeleton;

      const df = document.createDocumentFragment();
      df.appendChild(div.children[0]);

      if (!container) {
        // 回溯到父骨架
        container = getSkeletonContainer(true).querySelector(contentSelector);
      }

      container.appendChild(df);

      setSkeletonContainer(div.children[0]);

      // lastScope 形成链式
      if (lastScope) {
        scope.lastScope = lastScope;
      }
      lastScope = scope;

      return undefined;
    },
  };
};

hookSkeleton.hookName = 'skeleton';

export default hookSkeleton;
