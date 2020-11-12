import { HookScope } from '@saasfe/we-app-types';

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

export function callCapturedEventListeners(eventArguments) {
  if (eventArguments) {
    const eventType = eventArguments[0].type;
    if (routingEventsListeningTo.indexOf(eventType) >= 0) {
      capturedEventListeners[eventType].forEach(listener => {
        listener.apply(this, eventArguments);
      });
    }
  }
}

export type RoutingWithHook = (location: Location, activePageScopes?: HookScope) => Promise<boolean>;
let routingWithHook: RoutingWithHook = async () => true;

export const runRoutingWithHook: RoutingWithHook = async function (location: Location, activePageScopes?: HookScope) {
  const result = await routingWithHook(location, activePageScopes);
  return result;
};

export function setRoutingWithHook(fn: RoutingWithHook) {
  routingWithHook = fn;
}

let href = '';
async function routingEventHandler(event: Event) {
  const isSame = location.href === href;
  href = location.href;

  let isContinue: boolean|undefined;
  if (!isSame) {
    isContinue = await routingWithHook(location);
  }
  if (isContinue !== false) {
    callCapturedEventListeners([event]);
  }
}

window.addEventListener('popstate', routingEventHandler);
window.addEventListener('hashchange', routingEventHandler);

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
