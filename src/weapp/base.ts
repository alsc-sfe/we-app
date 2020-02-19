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
  type?: BaseType;
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

function compoundScope(base: Base, scope: HookScope<any> = {}): HookScope<any> {
  if (base.type === BaseType.root) {
    if (!scope.product) {
      scope.product = base as Product;
    }
    return scope;
  }

  scope[`${base.type}Name`] = base.name;
  scope[base.type as string] = base;

  return compoundScope(base.parent, scope);
}

export default class Base {
  type: BaseType;

  name: string;

  parent: Base;

  compoundScope = compoundScope;

  private children: Base[] = [];

  private config: BaseConfig;

  private skeletonContainer: HTMLElement|Element;

  private sandbox?: Window;

  private data: object = {};

  constructor(config?: BaseConfig) {
    if (config) {
      this.name = config.name;
      this.parent = config.parent;

      if (config.hooks) {
        specifyHooks(config.hooks, compoundScope(this));
      }

      this.config = config;
    }
  }

  appendChild(config: BaseConfig, Child: typeof Base) {
    if (this.getChild(config.name)) {
      return;
    }

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
    let config = pathname ? get(this.config, pathname) : this.config;
    if (!config && this.type !== BaseType.root) {
      config = this.parent.getConfig(pathname);
    }
    return config;
  }

  setConfig(config: BaseConfig) {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  getSkeletonContainer(traced = false) {
    let { skeletonContainer } = this;
    if (!skeletonContainer && this.parent.type !== BaseType.root) {
      skeletonContainer = this.parent.getSkeletonContainer(traced);
    }

    return skeletonContainer;
  }

  setSkeletonContainer(skeletonContainer: HTMLElement|Element) {
    this.skeletonContainer = skeletonContainer;
  }

  getRender() {
    let render = this.getConfig('render');
    if (!render && this.type !== BaseType.root) {
      render = this.parent.getRender();
    }
    return render;
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

  specifyHooks(params: boolean|UseHooksParams) {
    specifyHooks(params, compoundScope(this));
  }
}
