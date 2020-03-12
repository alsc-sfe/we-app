import get from 'lodash-es/get';
import { HookScope, UsingHooksConfigs, UsingScope } from '../hooks/type';
import { usingHooks } from '../hooks';

import { ResourceLoader, Resource } from '../resource-loader';
import Product from './product';
import Deferred from '../utils/deferred';
import { configHooks } from '../hooks/using';
import { getGlobalConfig, setResourceLoader, setPageContainer, setRender } from './config';
import { getScopeName } from '../helpers';

export interface Render {
  mount: (element: any, container?: Element, customProps?: any) => any;
  unmount: (container?: Element, customProps?: any) => any;
}

export interface BaseConfig {
  name?: string;
  type?: BaseType;
  parent?: Base;

  url?: Resource|Resource[];

  hooks?: UsingHooksConfigs;

  [prop: string]: any;
}

export enum BaseType {
  root = 'root',
  product = 'product',
  app = 'app',
  page = 'page'
}

export default class Base {
  type: BaseType;

  name: string;

  parent: Base;

  hookName: string;

  private children: Base[] = [];

  private config: BaseConfig;

  private sandbox?: Window;

  private data: object = {};

  private isStarted: boolean = false;

  private initDeferred: Deferred<Base>;

  constructor(config?: BaseConfig) {
    this.config = config;

    if (config) {
      this.name = config.name;
      this.parent = config.parent;
      this.type = config.type;

      if (config.hookName) {
        this.hookName = config.hookName;
      }

      if (config.hooks) {
        usingHooks(config.hooks, [this.compoundScope(this)]);
      }
    }
  }

  // 执行
  start() {
    if (this.isStarted) {
      return;
    }
    this.isStarted = true;

    this.children.forEach((child) => {
      child.start();
    });
  }

  compoundScope(base: Base, scope: HookScope = {}): HookScope {
    if (base.type === BaseType.root) {
      if (!scope.product) {
        scope.product = base as Product;
        scope.productName = base.name;
      }
      return scope;
    }

    scope[`${base.type}Name`] = base.name;
    scope[base.type as string] = base;

    if (base.hookName) {
      scope.hookName = base.hookName;
    }

    return this.compoundScope(base.parent, scope);
  }

  getInited() {
    return this.initDeferred?.promise;
  }

  async requireChildrenInited() {
    const pInited: Promise<any>[] = [];

    const pSelfInited = this.getInited();

    if (pSelfInited) {
      pInited.push(pSelfInited);
    } else if (this.children) {
      this.children.forEach((child) => {
        // 为undefined，则直接向下一级探索
        const pChildInited = child.getInited();
        if (pChildInited) {
          pInited.push(pChildInited);
        } else {
          const pChildrenInited = child.requireChildrenInited();
          pInited.push(pChildrenInited);
        }
      });
    }

    const initStatus = await Promise.all(pInited);
    return initStatus;
  }

  getConfig(pathname?: string): any {
    let { config } = this;
    // 先从全局设置对应scope中获取配置
    if (pathname) {
      const scope = this.compoundScope(this);
      const scopeName = getScopeName(scope);
      config = getGlobalConfig(pathname, scopeName);

      if (config === undefined) {
        config = get(this.config, pathname);
      }
    }
    // 再向上级查找
    if (config === undefined && this.type !== BaseType.root) {
      config = this.parent.getConfig(pathname);
    }

    return config;
  }

  setConfig(config: BaseConfig|string, value?: any) {
    if (typeof config === 'string') {
      this.config[config] = value;
      return;
    }

    this.config = {
      ...this.config,
      ...config,
    };
  }

  getData(pathname: string, traced = false) {
    if (!pathname) {
      return;
    }

    let data = get(this.data, pathname);
    if (traced && !data && this.type !== BaseType.root) {
      data = this.parent.getData(pathname, traced);
    }
    return data;
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

  usingHooks(params: UsingHooksConfigs, scopes?: HookScope[]) {
    usingHooks(params, scopes || [this.compoundScope(this)]);
  }

  configHooks(params: UsingHooksConfigs, scopes?: HookScope[]) {
    configHooks(params, scopes || [this.compoundScope(this)]);
  }

  setResourceLoader(resourceLoader: ResourceLoader, scopes?: UsingScope[]) {
    setResourceLoader(resourceLoader, resourceLoader?.scopes || scopes || [this.compoundScope(this)]);
  }

  setPageContainer(pageContainer: Element, scopes?: UsingScope[]) {
    setPageContainer(pageContainer, scopes || [this.compoundScope(this)]);
  }

  setRender(render: Render, scopes?: UsingScope[]) {
    setRender(render, scopes || [this.compoundScope(this)]);
  }

  protected async registerChildren(cfgs: BaseConfig[], Child: typeof Base) {
    const pChildren = cfgs.map((config) => this.registerChild(config, Child));
    const children = await Promise.all(pChildren);
    return children.filter((child) => child);
  }

  protected async registerChild(config: BaseConfig, Child: typeof Base) {
    let child = this.getChild(config.name);
    if (child) {
      return child;
    }

    child = new Child({
      ...config,
      parent: this,
    });

    this.children.push(child);

    return child as Base;
  }

  protected setInitDeferred() {
    if (!this.initDeferred || this.initDeferred.finished()) {
      this.initDeferred = new Deferred();
    }
  }

  protected setInited() {
    this.setInitDeferred();
    this.initDeferred.resolve(this);
  }

  protected getChild(name: string) {
    const child = this.children.find(c => c.name === name);
    return child;
  }
}
