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
  // 页面执行错误
  onError?: (args: any) => Promise<any>;
}

export interface Hook<T> {
  hookName: string;
  (opts: T): HookDesc;
}
