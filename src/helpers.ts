import { HookScope } from './hooks/type';
import { BaseType } from './weapp/base';

const InnerProductName = '__WeApp';
const HookWeAppName = 'hook';
const ScopeNameDivider = '/';

export {
  InnerProductName,
  HookWeAppName,
  ScopeNameDivider,
};

export interface GetPageNameOpts {
  productName?: string;
  weAppName?: string;
  pageName?: string;
  hookName?: string;
}

export function getScopeName({
  productName = '',
  weAppName = '',
  pageName = '',
  hookName = '',
}: GetPageNameOpts) {
  let pname = '';
  if (hookName) {
    // hook
    pname = `${InnerProductName}${ScopeNameDivider}${HookWeAppName}${ScopeNameDivider}${hookName}`;
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

export function checkUseSystem(useSystem: string[], type: string) {
  return useSystem.findIndex((s) => s === type) > -1;
}
