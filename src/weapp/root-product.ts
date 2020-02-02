import Product, { ProductConfig } from './product';
import { InnerProductName, HookWeAppName } from '../helpers';
import { Hook, HookScope } from '../hooks/type';

class RootProduct extends Product {
  products: Product[] = [];

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

  setHomePage(opts: HookScope) {}

  registerHook(hook: Hook<any>) {}

  registerHooks(hooks: Hook<any>[]) {

  }

  start() {}
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
