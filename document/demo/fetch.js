import { loginHost, gateways } from './const';

export default async function (isFrom3rdParty) {
  // __from_3rd_party=choice
  const fetchConfig = Symbol.for('fetchConfig');

  if (isFrom3rdParty) {
    window[fetchConfig] = {
      middlewares: [{
        name: 'noSession',
        action: async (ctx, next) => {
          await next();
          const { retType } = ctx.response;
          if (retType === 2) {
            window.top.postMessage({
              type: 'needLogin',
              data: {
                url: location.href,
              },
            }, '*');
          }
        },
      }],
    };
  }

  const SaasFetch = (await window.System.import('saas-fetch')).default;
  const SaasFetchMtop = (await window.System.import('saas-fetch-mtop')).default;

  if (gateways[window.env]) {
    SaasFetch.setup({
      gateway: gateways[window.env],
    });
  }

  SaasFetch.registerFetcher('mtop', SaasFetchMtop);

  SaasFetch.use([{
    name: 'noSession',
    action: async (ctx, next) => {
      await next();
      const { status } = ctx.res;
      if (status === 2) {
        // session失效跳转登陆
        window.console.error('接口session失效：', ctx.res);
        if (isFrom3rdParty) {
          window.top.postMessage({
            type: 'needLogin',
            data: {
              url: location.href,
            },
          }, '*');
        } else {
          // 项目内部跳转登陆页
          window.location.href = `https://${loginHost}/login.html?redirect=${encodeURIComponent(window.location.href)}&__fetch=2`;
        }
      }
    },
  }]);
}
