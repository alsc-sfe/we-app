export const getMicroApps = function getMicroApps(microAppsInfo: any, { context = {} }) {
  const { isFrom3rdParty } = context as any;
  const microAppNames = Object.keys(microAppsInfo);
  return microAppNames.map((appName) => {
    const appVersion = microAppsInfo[appName];
    const microAppInfo = {
      url: `https://g.alicdn.com/${appName}/${appVersion}/app-config.js`,
    };

    if (/app-config/g.test(appVersion)) {
      microAppInfo.url = appVersion;
    }

    if (appName === 'alsc-saas/web-boh-common') {
      microAppInfo.getModules = function (modules) {
        const module = modules.find(({ moduleName }) => moduleName === 'menu');
        if (module) {
          module.afterRouteDiscover = (match) => {
            document.querySelector('#microfe-layout').classList[match ? 'remove' : 'add']('microfe-layout--nomenu');
          };
        }

        if (!isFrom3rdParty) {
          return modules;
        }

        const mods = [];
        modules.forEach(mod => {
          if (mod.moduleName === 'navbar') {
            return;
          }

          mods.push(mod);
        });
        return mods;
      };
    }

    return microAppInfo;
  });
}
