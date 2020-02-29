import Product from '../weapp/product';
import WeApp from '../weapp/weapp';
import Page, { PageConfig } from '../weapp/page';
import { Render } from '../weapp/base';

export interface HookDesc<HookOpts> {
  hookName?: string;
  // hook的配置
  opts?: HookOpts;
  // 定义页面
  page?: PageConfig;
  // 路由跳转
  beforeRouting?: (args: HookScope<HookOpts>) => Promise<boolean|undefined>;
  // 页面资源加载
  beforeLoad?: (args: HookScope<HookOpts>) => Promise<any>;
  afterLoad?: (args: HookScope<HookOpts>) => Promise<any>;
  // 页面挂载（渲染）
  beforeMount?: (args: HookScope<HookOpts>) => Promise<boolean|undefined>;
  afterMount?: (args: HookScope<HookOpts>) => Promise<any>;
  // 页面卸载
  beforeUnmount?: (args: HookScope<HookOpts>) => Promise<boolean|undefined>;
  afterUnmount?: (args: HookScope<HookOpts>) => Promise<any>;
  // 页面执行错误
  onError?: (args: HookScope<HookOpts>) => Promise<any>;
}

export interface Hook<HookOpts> extends HookDesc<HookOpts> {
  (opts?: HookOpts): HookDesc<HookOpts>;
}

export interface HookScope<HookOpts> {
  productName?: string;
  weAppName?: string;
  pageName?: string;

  hookName?: string;

  product?: Product;
  weApp?: WeApp;
  page?: Page;

  opts?: HookOpts;

  hookPages?: string[];
  activeScopes?: HookScope<any>[];
  enabledScope?: HookScope<HookOpts>;

  errorHandler?: (error: Event) => Promise<any[]>;

  context?: Window;

  lastScope?: HookScope<HookOpts>;

  [prop: string]: any;
}
