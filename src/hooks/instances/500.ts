import { HookDesc, HookOpts, HookDescRunnerParam } from '../type';

export interface Hook500Opts extends HookOpts {
  [prop: string]: any;
}

let is500 = false;

const hook500: HookDesc<Hook500Opts> = {
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
      hookPageScope.page.setCustomProps({ error });
    }

    is500 = true;
  },
};

export default hook500;
