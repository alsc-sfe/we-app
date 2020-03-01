import { HookScope, Hook } from '../hooks/type';
import { getScope } from './root-product';

let homepage: HookScope;

export function setHomepage(s: HookScope|string) {
  let scope = s as HookScope;
  if (typeof s === 'string') {
    scope = getScope(s);
  }
  homepage = scope;
}

export function matchHomepage(s: HookScope|string) {
  let scope = s as HookScope;
  if (typeof s === 'string') {
    scope = getScope(s);
  }
  if (
    homepage && scope &&
    homepage.weAppName && scope.weAppName &&
    homepage.pageName && scope.pageName &&
    homepage.productName === scope.productName &&
    homepage.weAppName === scope.weAppName &&
    homepage.pageName === scope.pageName
  ) {
    return true;
  }

  return false;
}
