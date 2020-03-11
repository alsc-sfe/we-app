import { UsingScope, HookScope } from '../hooks/type';
import { getScope } from './root-product';

let homepage: UsingScope;

export function setHomepage(scope: UsingScope) {
  homepage = scope;
}

export function matchHomepage(s: UsingScope) {
  let scope = s as HookScope;
  if (typeof s === 'string') {
    scope = getScope(s);
  }

  let homepageScope = homepage as HookScope;
  if (typeof homepage === 'string') {
    homepageScope = getScope(homepage);
  }

  if (
    homepageScope && scope &&
    homepageScope.weAppName && scope.weAppName &&
    homepageScope.pageName && scope.pageName &&
    homepageScope.productName === scope.productName &&
    homepageScope.weAppName === scope.weAppName &&
    homepageScope.pageName === scope.pageName
  ) {
    return true;
  }

  return false;
}
