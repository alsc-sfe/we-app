import { getHooks } from './hooks';

/**
 * 增强路由
 * 1. 在singleSpa初始化前，拦截事件popstate和hashchange，
 *    后续的事件监听都放在内部监听序列中，不会再有新的原生监听
 * 2. 在singleSpa初始化后，拦截pushState和popState，
 *    在函数调用时，校验权限或页面是否存在，
 *    如果校验不通过或页面不存在，则更新异常收集器，终止当前页面渲染，渲染出错内容
 */
const routingEventsListeningTo = ['popstate', 'hashchange'];
const capturedEventListeners = {
  popstate: [],
  hashchange: [],
};

const originalAddEventListener = window.addEventListener;
const originalRemoveEventListener = window.removeEventListener;
const originalPushState = window.history.pushState;
const originalReplaceState = window.history.replaceState;

window.addEventListener('popstate', (ev) => {
  const hooks = getHooks('beforeRouting');
  hooks.reduce((p, h) => p.then(h()), Promise.resolve());
});

window.addEventListener = function (eventName: string, fn) {
  if (typeof fn === 'function') {
    if (routingEventsListeningTo.indexOf(eventName) >= 0 &&
      !capturedEventListeners[eventName].find(listener => listener === fn)) {
      capturedEventListeners[eventName].push(fn);
      return;
    }
  }

  return originalAddEventListener.apply(this, arguments);
};

window.removeEventListener = function (eventName: string, fn) {
  if (typeof fn === 'function') {
    if (routingEventsListeningTo.indexOf(eventName) >= 0) {
      capturedEventListeners[eventName] = capturedEventListeners[eventName].filter(listener => listener !== fn);
      return;
    }
  }

  return originalRemoveEventListener.apply(this, arguments);
};

export function enhanceRoutingFunction() {
  window.history.pushState = function (data, title, url) {
    const result = originalPushState.apply(this, arguments);

    return result;
  };

  window.history.replaceState = function (data, title, url) {
    const result = originalReplaceState.apply(this, arguments);
    return result;
  };
}
