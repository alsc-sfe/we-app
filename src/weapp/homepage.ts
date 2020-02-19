import { HookScope } from '../hooks/type';

let homepage: HookScope<any>;

export function setHomepage(scope: HookScope<any>) {
  homepage = scope;
}

export function matchHomepage(scope: HookScope<any>) {
  if (
    homepage && scope &&
    homepage.productName && scope.productName &&
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
