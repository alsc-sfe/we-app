import { HookScope } from './hooks/type';
import { BaseType } from './weapp/base';

export const InnerProductName = '__WeApp';
export const HookWeAppName = 'hook';
const PageNameDivider = '/';

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
    pname = `${InnerProductName}${PageNameDivider}${HookWeAppName}${PageNameDivider}${hookName}`;
  } else {
    // page
    pname = `${productName}${PageNameDivider}${weAppName}${PageNameDivider}${pageName}`;
  }
  return pname.replace(new RegExp(`(${PageNameDivider})+`), PageNameDivider);
}

export function parsePageName(pageName: string) {
  const result: HookScope<any> = {
    productName: '',
    weAppName: '',
    pageName: '',
    hookName: '',
  };
  const paths = pageName.split(PageNameDivider);

  if (paths.length === 3) {
    result.productName = paths[0];
    result.weAppName = paths[1];
    result.pageName = paths[2];

    if (paths[1] === HookWeAppName) {
      result.hookName = paths[1];
    }
  }

  if (paths.length === 2) {
    result.weAppName = paths[0];
    result.pageName = paths[1];
  }

  return result;
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
