import { HookScope } from './hooks/type';
import { BaseType } from './weapp/base';

export const InnerProductName = '__WeApp';
export const HookWeAppName = 'hook';
export const ScopeNameDivider = '/';

export interface GetPageNameOpts {
  productName?: string;
  weAppName?: string;
  pageName?: string;
  hookName?: string;
}

export function getPageName({
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
  return pname.replace(new RegExp(`(${ScopeNameDivider})+`), ScopeNameDivider);
}

export function isAncestorScope(ancestor: HookScope<any>, descendant: HookScope<any>) {
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
