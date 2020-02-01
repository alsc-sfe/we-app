import Product, { ProductConfig } from './product';
import { InnerProductName, HookWeAppName, GetPageNameOpts } from '../helpers';
import { Hook } from '../hooks/type';

export interface RootProductConfig extends ProductConfig {
  // 生命周期钩子
  hooks?: Hook<any>[];
}

class RootProduct extends Product {
  products: Product[] = [];

  constructor(config?: RootProductConfig) {
    super(config);

    if (config.hooks) {
      this.registerHooks(config.hooks);
    }
  }

  registerProducts(cfgs: ProductConfig[] = []) {
    cfgs.forEach(config => {
      this.registerProduct(config);
    });
  }

  registerProduct(config: ProductConfig) {
    const product = new Product(config);
    this.products.push(product);
    return product;
  }

  getProduct(productName: string) {
    const product = this.products.find((p) => {
      return p.productName === productName;
    });
    return product;
  }

  setHomePage(opts: GetPageNameOpts) {}

  registerHook(hook: Hook<any>) {}

  registerHooks(hooks: Hook<any>[]) {

  }
}

const rootProduct = new RootProduct();
// 注册内置子产品
const innerProduct = rootProduct.registerProduct({
  productName: InnerProductName,
});
const hookWeApp = innerProduct.registerWeApp({
  weAppName: HookWeAppName,
});

export default rootProduct;
export {
  innerProduct,
  hookWeApp,
};
