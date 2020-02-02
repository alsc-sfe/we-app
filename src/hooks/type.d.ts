import Product from '../weapp/product';
import WeApp from '../weapp/weapp';
import Page from '../weapp/page';

export interface HookDesc {
  page?: {
    activityFunction: () => boolean;
    render: (args: any) => void;
  };
  // 路由切换前
  beforeRouting?: (args: any) => Promise<boolean|undefined>;
  // 页面资源加载前
  beforeLoad?: (args: any) => Promise<any>;
  // 页面渲染前
  beforeRender?: (args: any) => Promise<boolean|undefined>;
  // 页面卸载后
  afterUmount?: (args: any) => Promise<any>;
  // 页面执行错误
  onError?: (args: any) => Promise<any>;
}

export interface Hook<T> {
  hookName: string;
  (opts: T): HookDesc;
}

export interface HookScope {
  productName?: string;
  weAppName?: string;
  pageName?: string;
  hookName?: string;
  product?: Product;
  weApp?: WeApp;
  page?: Page;
  [prop: string]: any;
}
