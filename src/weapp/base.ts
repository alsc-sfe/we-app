import get from 'lodash-es/get';
import { HookScope } from '../hooks/type';
import { specifyHooks } from '../hooks';
import { UseHooksParams } from '../hooks/hooks';
import { ResourceLoader } from '../resource-loader';
import Product from './product';

export interface Render {
  mount: (element: any, opts?: HookScope<any>) => any;
  unmount: (opts?: HookScope<any>) => any;
}

export interface BaseConfig {
  name?: string;
  parent?: Base;

  hooks?: boolean | UseHooksParams;

  render?: Render;

  resourceLoader?: ResourceLoader;
  basicLibs?: string[];
  useSystem?: string[];

  [prop: string]: any;
}

export enum BaseType {
  root = 'root',
  product = 'product',
  weApp = 'weApp',
  page = 'page'
}

function getScope(base: Base, scope: HookScope<any> = {}) {
  if (base.type === BaseType.root) {
    if (!scope.product) {
      scope.product = base as Product;
    }
    return scope;
  }

  scope[`${base.type}Name`] = base.name;
  scope[base.type as string] = base;

  getScope(base.parent, scope);
}

export default class Base {
  type: BaseType;

  name: string;

  parent: Base;

  private children: Base[];

  private config: BaseConfig;

  private skeletonContainer: HTMLElement|Element;

  private sandbox?: Window;

  private data: object = {};

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

  getRender() {
    return this.getConfig('render');
  }

  getData(pathname?: string) {
    return get(this.data, pathname);
  }

  setData(pathname: string|symbol|object, data?: any) {
    if (typeof pathname === 'object') {
      this.data = {
        ...this.data,
        ...pathname,
      };
      return;
    }

    this.data[pathname] = data;
  }
}
