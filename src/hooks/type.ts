import Product from '../weapp/product';
import WeApp from '../weapp/weapp';
import Page, { PageConfig } from '../weapp/page';
import { Render } from '../weapp/base';

export enum LifecycleHookEnum {
  page = 'page',
  beforeRouting = 'beforeRouting',
  beforeLoad = 'beforeLoad',
  afterLoad = 'afterLoad',
  beforeMount = 'beforeMount',
  afterMount = 'afterMount',
  beforeUnmount = 'beforeUnmount',
  afterUnmount = 'afterUnmount',
  onError = 'onError'
}

export interface HookDescRunnerParam<HookOpts> {
  pageScope: HookScope;
  hookScope: HookScope;
  opts?: HookOpts;
  matched?: boolean;

  hookPages?: string[];
  activePageScopes?: HookScope[];

  nextHookDescRunnerParam?: HookDescRunnerParam<HookOpts>;

  getRender?: () => Render;
  errorHandler?: (error: Event) => Promise<any>;

  context?: Window;

  [prop: string]: any;
}

export type HookDescEntity<HookOpts> = (lifecycleHook: LifecycleHookEnum) => HookDescRunner<HookOpts>|PageConfig;

export type LifecycleHookRunner<HookOpts> = (props: HookDescRunnerParam<HookOpts>) => Promise<undefined|boolean|any>;

export interface HookDescRunner<HookOpts> {
  // 上一个匹配scope需要做的清理
  clear?: LifecycleHookRunner<HookOpts>;
  // 当前匹配scope需要执行的逻辑
  exec?: LifecycleHookRunner<HookOpts>;
}

export interface HookOpts {
  page?: PageConfig;
  [prop: string]: any;
}

export interface HookDesc<HookOpts> {
  hookName?: string;
  // 定义页面
  page?: PageConfig;
  // 路由跳转
  beforeRouting?: LifecycleHookRunner<HookOpts>|HookDescRunner<HookOpts>;
  // 页面资源加载
  beforeLoad?: LifecycleHookRunner<HookOpts>;
  afterLoad?: LifecycleHookRunner<HookOpts>;
  // 页面挂载（渲染）
  beforeMount?: LifecycleHookRunner<HookOpts>;
  afterMount?: LifecycleHookRunner<HookOpts>;
  // 页面卸载
  beforeUnmount?: LifecycleHookRunner<HookOpts>;
  afterUnmount?: LifecycleHookRunner<HookOpts>;
  // 页面执行错误
  onError?: LifecycleHookRunner<HookOpts>;
}

export interface HookScope {
  scopeName?: string;

  productName?: string;
  weAppName?: string;
  pageName?: string;

  hookName?: string;

  product?: Product;
  weApp?: WeApp;
  page?: Page;

  hookPages?: string[];
  activeScopes?: HookScope[];
  enabledScope?: HookScope;

  errorHandler?: (error: Event) => Promise<any[]>;

  context?: Window;

  [prop: string]: any;
}

export type EnabledHooks = string[]|[string, any][];
export interface HookConfig { [hookName: string]: any }
export type DisabledHooks = string[];
export type SpecifyHooksConfig = EnabledHooks|{ config: HookConfig; disabled: DisabledHooks };
