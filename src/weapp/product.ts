/**
 * 定义产品级别的共用的功能
 * 1. 基础dom结构，每个产品可单独定义
 * 2. 要加载的基础资源，每个产品、微应用可单独定义
 * 3. 页面渲染实现，每个产品、微应用可单独定义
 * 4. 生命周期钩子，每个产品可单独定义，各个钩子根据条件(当前激活的产品、微应用、页面)决定是否被调用
 *    hooks被启用的位置，决定了其判断条件
 */
import WeApp, { WeAppConfig } from './weapp';
import { Hook } from '../hooks/type';
import { GetPageNameOpts } from '../helpers';

export interface Render {
  mount: (element: any, opts?: GetPageNameOpts) => any;
  unmount: (opts?: GetPageNameOpts) => any;
}

export interface ProductConfig {
  // 产品名称
  productName?: string;
  // 基础dom
  skeleton?: string;
  // 需要前置加载的资源
  baseResources?: string[];
  // 微应用列表
  weApps?: WeAppConfig[];
  // 页面渲染实现
  render?: Render;
}

class Product {
  productName: string;

  private skeleton: string;

  private baseResources: string[];

  private weApps: WeApp[];

  private render: Render;

  constructor(config?: ProductConfig) {
    if (config) {
      this.productName = config.productName;
      this.skeleton = config.skeleton;
    }
  }

  registerWeApp(config: WeAppConfig) {
    const weApp = new WeApp({
      ...config,
      product: this,
    });

    this.weApps.push(weApp);

    return weApp;
  }

  getWeApp(weAppName: string) {
    const weApp = this.weApps.find(wa => wa.weAppName === weAppName);
    return weApp;
  }

  getStatus() {
    return '';
  }
}

export default Product;
