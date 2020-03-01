import { registerHooks, getPageConfigs } from './register';
import { specifyHooks } from './specify';
import { runLifecycleHook } from './xecute';

import hookSkeleton from './instances/skeleton';
import hookBasicLibs from './instances/basic-libs';
import hook404 from './instances/404';
import hookPageContainer from './instances/page-container';

export {
  registerHooks,
  getPageConfigs,
  specifyHooks,
  runLifecycleHook,
};

registerHooks([
  hookSkeleton,
  hookPageContainer,
  hookBasicLibs,
  hook404,
]);
