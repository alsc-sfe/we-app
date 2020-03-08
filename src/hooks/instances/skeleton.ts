/**
 * 骨架必须在路由切换前确定是显示还是隐藏
 * 页面容器在路由切换前显示，在卸载后隐藏
 */
import { HookDesc, HookDescRunnerParam, HookOpts } from '../type';

export interface HookSkeletonOpts extends HookOpts {
  skeleton: string;
  container: HTMLElement;
  contentSelector: string;
  [prop: string]: any;
}

const hookSkeleton: HookDesc<HookSkeletonOpts> = {
  hookName: 'skeleton',
  beforeRouting: {
    exec: async (param: HookDescRunnerParam<HookSkeletonOpts>) => {
      const { hookScope } = param;
      // 使用启用scope的级别获取骨架容器
      const base = hookScope.page || hookScope.weApp || hookScope.product;

      // 渲染骨架
      let { opts: { container } } = param;
      const { opts: { skeleton, contentSelector } } = param;

      if (!base.getData('skeletonContainer')) {
        const div = document.createElement('div');
        div.innerHTML = skeleton;
        const skeletonContainer = div.children[0];

        const df = document.createDocumentFragment();
        df.appendChild(skeletonContainer);

        if (!container) {
          // 回溯到父骨架
          container = base.getData('contentContainer', true);
        }

        container.appendChild(df);

        base.setData('skeletonContainer', skeletonContainer);

        const contentContainer = skeletonContainer.querySelector(contentSelector);
        base.setData('contentContainer', contentContainer);
      }
    },
    clear: async (param: HookDescRunnerParam<HookSkeletonOpts>) => {
      const { hookScope, nextHookDescRunnerParam } = param;
      const { hookScope: nextHookScope } = nextHookDescRunnerParam;

      const base = hookScope.page || hookScope.weApp || hookScope.product;

      const elSkeleton = base.getData('skeletonContainer');

      let { opts: { container } } = param;
      // 需要处理取父骨架的情况，取父骨架的内容区
      if (!container) {
        // 回溯到父骨架
        container = base.getData('contentContainer', true);
      }

      if (!nextHookScope) {
        container.removeChild(elSkeleton);
        return;
      }

      // 使用启用scope的级别获取骨架容器
      const nextBase = nextHookScope.page || nextHookScope.weApp || nextHookScope.product;

      // 跨产品时，是否需要隐藏当前skeleton
      // 当是父子关系时，父级不可清除
      // 不为父子关系则清除
      if (nextBase.getData('skeletonContainer', true) !== elSkeleton) {
        container.removeChild(elSkeleton);
      }
    },
  },
};

export default hookSkeleton;
