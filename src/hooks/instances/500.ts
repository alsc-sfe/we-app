import { HookDesc, HookOpts, HookDescRunnerParam, UsingHookOpts } from '../type';

export interface Hook500Opts extends HookOpts {
  [prop: string]: any;
}

let is500 = false;

const hook500Desc: HookDesc<Hook500Opts> = {
  hookName: '500',
  page: {
    hooks: ['pageContainer', '500'],
    activityFunction: () => is500,
  },

  async beforeRouting() {
    is500 = false;
  },

  async onError(param: HookDescRunnerParam<Hook500Opts>) {
    const { hookPageScope, error } = param;
    if (hookPageScope) {
      hookPageScope.setCustomProps({ error });
    }

    is500 = true;
  },
};

const hook500: UsingHookOpts<Hook500Opts> = {
  hookName: '500',
  hookDesc: hook500Desc,
};

export default hook500;
