import get from 'lodash-es/get';
import { HookScope } from '../hooks/type';
import { specifyHooks } from '../hooks';
import { UseHooksParams } from '../hooks/hooks';

export interface BaseConfig {
  name?: string;
  children?: any[];
  hooks?: boolean | UseHooksParams;
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

  private skeletonContainer: HTMLElement|Element;

  constructor(config?: BaseConfig) {
    if (config) {
      this.name = config.name;
      this.parent = config.parent;

      if (config.hooks) {
        specifyHooks(config.hooks, getScope(this));
      }

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

  getSkeletonContainer(traced = false) {
    // eslint-disable-next-line
    let base: Base = this;

    while (traced && !base.skeletonContainer) {
      base = this.parent;

      if (base.type === BaseType.root) {
        break;
      }
    }

    return base.skeletonContainer;
  }

  setSkeletonContainer(skeletonContainer: HTMLElement|Element) {
    this.skeletonContainer = skeletonContainer;
  }
}
