/**
 * singleSpa 覆盖了原生的路由事件和方法，
 * 为实现路由拦截功能，需要对singleSpa的覆盖方式再做一次覆盖
 */
// 覆盖路由事件
import { enhanceRoutingFunction } from './routing';
import singleSpa, { navigateToUrl } from 'single-spa';
// 覆盖路由方法
enhanceRoutingFunction();

export default singleSpa;
export {
  navigateToUrl,
};
