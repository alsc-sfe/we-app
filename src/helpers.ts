const InnerProductName = '__WeApp';
const HookWeAppName = 'hook';
const PageNameDivider = '/';

export function getPageName({
  productName = '',
  weAppName = '',
  pageName = '',
  hookName = '',
}) {
  let pname = '';
  if (hookName) {
    // hook
    pname = `${InnerProductName}${PageNameDivider}${HookWeAppName}${PageNameDivider}${hookName}`;
  } else {
    // page
    pname = `${productName}${PageNameDivider}${weAppName}${PageNameDivider}${pageName}`;
  }
  return pname.replace(/\/+/g, PageNameDivider);
}

export function parsePageName(pageName: string) {
  const result = {
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

export function getPageConfig(pageName, pathname) {
  return '';
}
