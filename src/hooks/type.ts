import Product from '../weapp/product';
import App from '../weapp/app';
import Page, { PageConfig } from '../weapp/page';
import { Render } from '../weapp/base';

export enum LifecycleHookEnum {
  page = 'page',
  beforeRouting = 'beforeRouting',
  beforeLoad = 'beforeLoad',
  afterLoad = 'afterLoad',
  beforeMount = 'beforeMount',
  onMountPrevented = 'onMountPrevented',
  afterMount = 'afterMount',
  beforeUnmount = 'beforeUnmount',
  afterUnmount = 'afterUnmount',
  onError = 'onError'
}

export interface HookDescRunnerParam<HookOpts> {
  // 当前页面对应范围
  pageScope: HookScope;
  // 当前匹配扩展对应工作范文
  hookScope: HookScope;
  // 当前匹配扩展的页面对应范围
  hookPageScope?: HookScope;
  opts?: HookOpts;
  matched?: boolean;

  hookPages?: string[];
  activePageScopes?: HookScope[];

  nextHookDescRunnerParam?: HookDescRunnerParam<HookOpts>;

  getRender?: () => Render;
  errorHandler?: (error: Event) => Promise<any>;

  root?: Window;
  context?: any;

  // 错误信息
  error?: Error;

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

type LifecycleHookName = Exclude<keyof typeof LifecycleHookEnum, 'page' | 'beforeRouting'>;

export type HookDesc<HookOpts> = {
  [hook in LifecycleHookName]?: LifecycleHookRunner<HookOpts>;
} & {
  hookName?: string;
  // 定义页面
  page?: PageConfig;
  // 路由跳转
  beforeRouting?: LifecycleHookRunner<HookOpts> | HookDescRunner<HookOpts>;
};

export type UsingScope = string|HookScope;
export interface UsingHookOpts<HookOpts> {
  hookName: string;
  // 自定义插件
  hookDesc?: HookDesc<HookOpts>;
  // 配置
  config?: HookOpts;
  // 工作范围
  scopes?: UsingScope[];
}

export interface HookScope {
  scopeName?: string;

  productName?: string;
  appName?: string;
  pageName?: string;

  hookName?: string;

  product?: Product;
  app?: App;
  page?: Page;

  hookPages?: string[];
  activeScopes?: HookScope[];
  enabledScope?: HookScope;

  errorHandler?: (error: Event) => Promise<any[]>;

  root?: Window;

  context?: any;

  [prop: string]: any;
}

export type UsingHooksConfigs = (UsingHookOpts<any>|string)[]|null;
