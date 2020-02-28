import { registerHooks } from './hooks';
import hookSkeleton from './instances/skeleton';
import hookBasicLibs from './instances/basic-libs';
import hook404 from './instances/404';

export * from './hooks';

registerHooks([
  hookSkeleton,
  hookBasicLibs,
  hook404,
]);
