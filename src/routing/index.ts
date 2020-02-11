import { runHook } from '../hooks/hooks';
import singleSpa from '../single-spa';
import rootProduct from '../weapp/root-product';
import { parseUri } from './helper';

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

function callCapturedEventListeners(eventArguments) {
  if (eventArguments) {
    const eventType = eventArguments[0].type;
    if (routingEventsListeningTo.indexOf(eventType) >= 0) {
      capturedEventListeners[eventType].forEach(listener => {
        listener.apply(this, eventArguments);
      });
    }
  }
}

function routingWithHook(location: Location) {
  const activePages = singleSpa.checkActivityFunctions(location);
  const activeScopes = activePages.map((pageName) => {
    return rootProduct.getScope(pageName);
  });

  const opts = {
    activePages,
    getScope: rootProduct.getScope,
  };
  return runHook('beforeRouting', activeScopes, opts);
}

function routingEventHandler(event: Event) {
  routingWithHook(location).then((isContinue: boolean|undefined) => {
    if (isContinue !== false) {
      callCapturedEventListeners(event);
    }
  });
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

function routingFunctionWithHook(url: string) {
  const destination = parseUri(`${location.protocol}//${location.hostname}${location.port ? `:${location.port}` : ''}${url}`);
  return routingWithHook(destination);
}

export function enhanceRoutingFunction() {
  const currentPushState = window.history.pushState;
  const currentPopState = window.history.replaceState;

  window.history.pushState = function (_data, _title, url) {
    routingFunctionWithHook(url).then((isContinue: boolean|undefined) => {
      if (isContinue !== false) {
        currentPushState.apply(this, arguments);
      }
    });
  };

  window.history.replaceState = function (_data, _title, url) {
    routingFunctionWithHook(url).then((isContinue: boolean|undefined) => {
      if (isContinue !== false) {
        currentPopState.apply(this, arguments);
      }
    });
  };
}

function createPopStateEvent(state: any) {
  // https://github.com/CanopyTax/single-spa/issues/224 and https://github.com/CanopyTax/single-spa-angular/issues/49
  // We need a popstate event even though the browser doesn't do one by default when you call replaceState, so that
  // all the applications can reroute.
  try {
    return new PopStateEvent('popstate', { state });
  } catch (err) {
    // IE 11 compatibility https://github.com/CanopyTax/single-spa/issues/299
    // https://docs.microsoft.com/en-us/openspecs/ie_standards/ms-html5e/bd560f47-b349-4d2c-baa8-f1560fb489dd
    const evt = document.createEvent('PopStateEvent');
    // @ts-ignore
    evt.initPopStateEvent('popstate', false, false, state);
    return evt;
  }
}

export function startRouting() {
  routingWithHook(location).then((isContinue: boolean|undefined) => {
    if (isContinue !== false) {
      callCapturedEventListeners(createPopStateEvent(null));
    }
  });
}
