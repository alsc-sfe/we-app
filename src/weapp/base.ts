import get from 'lodash-es/get';
import { HookScope } from '../hooks/type';
import { DisabledHooks, disableHooks } from '../hooks/hooks';

export interface BaseConfig {
  name?: string;
  children?: any[];
  disabledHooks?: DisabledHooks;
  hooksConfig?: { [prop: string]: any };
  parent?: Base;
  [prop: string]: any;
}

export enum BaseType {
  root = 'root',
  product = 'product',
  weApp = 'weApp',
  page = 'page'
}

function getScope(base: Base, scope: HookScope = {}) {
  if (base.type === BaseType.root) {
    return scope;
  }

  scope[`${base.type}Name`] = base.name;
  scope[base.type as string] = base;

  if (base.parent !== base) {
    return getScope(base, scope);
  }

  return scope;
}

export default class Base {
  type: BaseType;

  name: string;

  parent: Base;

  private children: Base[];

  private config: BaseConfig;

  constructor(config?: BaseConfig) {
    if (config) {
      this.name = config.name;
      this.parent = config.parent;

      disableHooks(config.disabledHooks, getScope(this));

      this.config = config;
    }
  }

  registerChild(config: BaseConfig, Child: typeof Base) {
    const child = new Child({
      ...config,
      parent: this,
    });

    this.children.push(child);

    return child;
  }

  getChild(name: string) {
    const child = this.children.find(c => c.name === name);
    return child;
  }

  getConfig(pathname?: string) {
    return get(this.config, pathname);
  }
}
