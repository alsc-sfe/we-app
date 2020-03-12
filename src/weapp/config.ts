import { ResourceLoader } from '../resource-loader';
import { Render } from './base';
import { ScopeNameDivider, getScopeName } from '../helpers';
import { UsingScope } from '../hooks/type';

interface Config {
  pageContainer: {
    [scopeName: string]: Element;
  };
  resourceLoader: {
    [scopeName: string]: ResourceLoader;
  };
  render: {
    [scopeName: string]: Render;
  };
}

const config: Config = {
  pageContainer: {},
  resourceLoader: {},
  render: {},
};

const configKeys = Object.keys(config);

function setGlobalConfig(pathname: string, value: any, scopes: UsingScope[]) {
  scopes.forEach((scope) => {
    const scopeName = getScopeName(scope);
    config[pathname][scopeName] = value;
  });
}

export function setPageContainer(value: Element, scopes: UsingScope[]) {
  setGlobalConfig('pageContainer', value, scopes);
}

export function setResourceLoader(value: ResourceLoader, scopes: UsingScope[]) {
  setGlobalConfig('resourceLoader', value, scopes);
}

export function setRender(value: Render, scopes: UsingScope[]) {
  setGlobalConfig('render', value, scopes);
}

export function getGlobalConfig(pathname: string, scopeName: string) {
  if (configKeys.indexOf(pathname) === -1) {
    return;
  }

  let value: any = config[pathname][scopeName];

  if (!scopeName) {
    return value;
  }

  if (!value) {
    return value;
  }

  if (pathname === 'resourceLoader') {
    // 没有找到资源加载器描述，向上级查找
    if (!(value as ResourceLoader)?.desc) {
      const names = scopeName.split(ScopeNameDivider);
      names.pop();

      let name: string;
      if (names.length > 1) {
        name = names.join(ScopeNameDivider);
      } else {
        name = names[1] || '';
      }

      const val = getGlobalConfig(pathname, name) as ResourceLoader;
      value = {
        desc: val?.desc,
        config: (value as ResourceLoader)?.config,
      };
    }
  }

  return value;
}
