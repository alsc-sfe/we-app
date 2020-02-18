import Product from '../weapp/product';
import WeApp from '../weapp/weapp';
import Page from '../weapp/page';

export interface PageRender {
  mount: (args: any) => void;
  unmount: (args: any) => void;
}

export interface HookDesc<HookOpts> {
  hookName?: string;
  // hook的配置
  opts?: HookOpts;
  // 定义页面
  page?: {
    activityFunction: (location: Location) => boolean;
    render: PageRender;
  };
  // 路由切换前
  beforeRouting?: (args: HookScope<HookOpts>) => Promise<boolean|undefined>;
  // 页面资源加载前
  beforeLoad?: (args: HookScope<HookOpts>) => Promise<any>;
  // 页面渲染前
  beforeMount?: (args: HookScope<HookOpts>) => Promise<boolean|undefined>;
  afterMount?: (args: HookScope<HookOpts>) => Promise<any>;
  beforeUnmount?: (args: HookScope<HookOpts>) => Promise<boolean|undefined>;
  // 页面卸载后
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

  enabledScope?: HookScope<HookOpts>;

  errorHandler?: (error: Event) => Promise<any[]>;

  context?: Window;

  lastScope?: HookScope<HookOpts>;

  [prop: string]: any;
}
