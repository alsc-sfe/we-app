import { callCapturedEventListeners, runRoutingWithHook, RoutingWithHook, setRoutingWithHook } from './event-intercept';
import { parseUri } from './helper';
import { getActivePageScopes, getScope } from '../weapp';
import { HookScope, LifecycleHookEnum } from '@saasfe/we-app-types';
import { checkActivityFunctions } from 'single-spa';
import { runLifecycleHook } from '../hooks';

async function routingFunctionWithHook(url: string) {
  const destination = parseUri(`${location.protocol}//${location.hostname}${location.port ? `:${location.port}` : ''}${url}`);
  const isContinue: boolean|undefined = await runRoutingWithHook(destination);
  return isContinue;
}

const currentPushState = window.history.pushState;
const currentPopState = window.history.replaceState;

window.history.pushState = async function (_data, _title, url) {
  const isContinue: boolean|undefined = await routingFunctionWithHook(url);
  if (isContinue !== false) {
    currentPushState.apply(this, arguments);
  }
};

window.history.replaceState = async function (_data, _title, url) {
  const isContinue: boolean|undefined = await routingFunctionWithHook(url);
  if (isContinue !== false) {
    currentPopState.apply(this, arguments);
  }
};

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

// 设置路由生命周期钩子
// 放在这里是避免出现循环依赖
const routingWithHook: RoutingWithHook = async (location: Location, activePageScopes: HookScope[] = []) => {
  let activeScopes: HookScope[] = activePageScopes;
  // 未注册页面，则使用根产品作为scope
  if (activeScopes.length === 0) {
    const activePages = checkActivityFunctions(location);
    activeScopes = activePages.map((pageName) => {
      return getScope(pageName);
    });
  }

  const isContinue = await runLifecycleHook(LifecycleHookEnum.beforeRouting, activeScopes);
  return isContinue;
};

setRoutingWithHook(routingWithHook);

// 首次进入执行路由拦截
let isStarted = false;
export async function startRouting() {
  if (isStarted) {
    return;
  }
  isStarted = true;

  const activeScopes = getActivePageScopes(location);
  await runRoutingWithHook(location, activeScopes).then((isContinue: boolean|undefined) => {
    if (isContinue !== false) {
      callCapturedEventListeners([createPopStateEvent(null)]);
    }
  });
}
