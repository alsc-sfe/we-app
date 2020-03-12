const loginHosts = {
  prod: 'login.koubei.com',
  pre: 'pre-login.koubei.com',
  daily: 'login.koubei.test',
  local: 'login.koubei.test',
};

export const loginHost = loginHosts[window.env] || loginHosts.prod;

export const gateways = {
  daily: 'acs-waptest,koubei.test',
  pre: 'acs.wapa,koubei.com',
  prod: 'mtop,koubei.com',
};

export const isDev = window.env !== 'prod';

export const timestampQuery = isDev ? `?t=${new Date().getTime()}` : '';

export const cdnHost = isDev ? '//dev.g.alicdn.com' : '//g.alicdn.com';
