import get from 'lodash-es/get';
import { HookScope, UsingScope } from './hooks/type';
import { BaseType } from './weapp/base';

const BuildinProductName = '__buildin';
const HookWeAppName = 'hook';
const ScopeNameDivider = '/';

export {
  BuildinProductName,
  HookWeAppName,
  ScopeNameDivider,
};

export function getScopeName(scope: UsingScope) {
  if (typeof scope === 'string') {
    return scope;
  }

  const {
    productName = '',
    weAppName = '',
    pageName = '',
    hookName = '',
  } = scope;

  let pname = '';
  if (hookName) {
    // hook
    pname = `${BuildinProductName}${ScopeNameDivider}${HookWeAppName}${ScopeNameDivider}${hookName}`;
  } else {
    // page
    pname = `${productName}${ScopeNameDivider}${weAppName}${ScopeNameDivider}${pageName}`;
  }
  pname = pname.replace(new RegExp(`(${ScopeNameDivider})+`), ScopeNameDivider);
  if (pname[0] === ScopeNameDivider) {
    pname = pname.slice(1);
  }
  if (pname[pname.length - 1] === ScopeNameDivider) {
    pname = pname.slice(0, pname.length - 1);
  }
  return pname;
}

export function isAncestorScope(ancestor: HookScope, descendant: HookScope) {
  if (ancestor.product.type === BaseType.root) {
    return true;
  }

  if (
    ancestor.productName && !ancestor.weAppName &&
    ancestor.productName === descendant.productName
  ) {
    return true;
  }

  if (
    ancestor.productName && ancestor.weAppName && !ancestor.pageName &&
    ancestor.productName === descendant.productName &&
    ancestor.weAppName === descendant.weAppName &&
    descendant.pageName
  ) {
    return true;
  }

  return false;
}

export function makeSafeScope(scope: HookScope) {
  if (!scope || !scope.product) {
    return;
  }

  const { page, weApp, product } = scope;
  const base = page || weApp || product;

  const safeScope: HookScope = {};

  const safeProperties = ['productName', 'weAppName', 'pageName', 'hookName'];
  safeProperties.forEach((property) => {
    safeScope[property] = get(scope, property);
  });

  const safeBaseFunctions = ['getConfig', 'getData', 'setData'];
  safeBaseFunctions.forEach((property) => {
    let fn = get(base, property);
    if (fn) {
      fn = (fn as Function).bind(base);
    }
    safeScope[property] = fn;
  });

  const safePageFunctions = ['getPageContainer', 'setPageContainer', 'setCustomProps'];
  safePageFunctions.forEach((property) => {
    let fn = get(page, property);
    if (fn) {
      fn = (fn as Function).bind(page);
    }
    safeScope[property] = fn;
  });

  return safeScope;
}
