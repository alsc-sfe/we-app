import hookBasicLibs from './instances/basic-libs';
import { registerHooks, specifyHooks, runLifecycleHook } from './hooks';
import hookSkeleton from './instances/skeleton';

export { registerHooks, specifyHooks, runLifecycleHook };

registerHooks([
  hookSkeleton,
  hookBasicLibs,
]);
