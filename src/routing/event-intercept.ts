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

export type RoutingWithHook = (location: Location) => Promise<boolean>;
let routingWithHook: RoutingWithHook = async () => true;

export function getRoutingWithHook() {
  return routingWithHook;
}

export function setRoutingWithHook(fn: RoutingWithHook) {
  routingWithHook = fn;
}

async function routingEventHandler(event: Event) {
  const isContinue: boolean|undefined = await routingWithHook(location);
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
