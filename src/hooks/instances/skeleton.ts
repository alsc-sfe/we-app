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

let lastScope: HookDescRunnerParam<HookSkeletonOpts>;

const hookSkeleton: HookDesc<HookSkeletonOpts> = {
  hookName: 'skeleton',
  async beforeRouting(param: HookDescRunnerParam<HookSkeletonOpts>) {
    const { hookScope } = param;
    // 使用启用scope的级别获取骨架容器
    const base = hookScope.page || hookScope.weApp || hookScope.product;

    // 跨产品时，是否需要隐藏当前skeleton
    // 此处有2个问题，
    // 1. 当是父子关系时，父级不可清除
    // 2. 多个skeleton，lastScope会被覆盖，导致清除不彻底
    //    所以，lastScope使用链式
    if (lastScope) {
      let { opts: { container: lastContainer } } = lastScope;
      const { opts: { contentSelector: lastContentSelector },
        hookScope: lastEnabledScope } = lastScope;
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
    let { opts: { container } } = param;
    const { opts: { skeleton, contentSelector } } = param;

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
        param.lastScope = lastScope;
      }
      lastScope = param;
    }
  },
};

export default hookSkeleton;
