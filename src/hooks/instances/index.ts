import hookSkeleton from './skeleton';
import hookBasicLibs from './basic-libs';
import hookPageContainer from './page-container';
import hookLoading from './loading';
import hook404 from './404';
import hook403 from './403';
import hook500 from './500';

const buildinHooks = [
  hookBasicLibs,
  hookSkeleton,
  hookPageContainer,
  hookLoading,
  hook404,
  hook403,
  hook500,
];

export default buildinHooks;
