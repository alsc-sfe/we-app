import get from 'lodash-es/get';
import { HookScope, UsingHooksConfigs, UsingScope, SafeHookScope } from '../hooks/type';
import { usingHooks } from '../hooks';

import { ResourceLoader, Resource } from '../resource-loader';
import Product from './product';
import Deferred from '../utils/deferred';
import { configHooks } from '../hooks/using';
import { setResourceLoader, setPageContainer, setRender, getGlobalConfig } from './config';
import { getScopeName } from '../helpers';
import { ConfigName, DataName } from '../const';
import { RouterType } from '..';

export interface RenderCustomProps {
  basename?: string;
  routerType?: RouterType;
  pageScope?: SafeHookScope;
  context?: any;
  [prop: string]: any;
}
export interface Render {
  mount: (element: any, container: Element|null, customProps?: RenderCustomProps) => any;
  unmount: (container: Element|null, customProps?: RenderCustomProps) => any;
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
    let config = { ...this.config };

    // 先从本级获取
    if (pathname) {
      config = get(this.config, pathname);
      // 再向上级查找
      if (config === undefined && this.type !== BaseType.root) {
        config = this.parent.getConfig(pathname);
      }
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

  getResourceLoader(): ResourceLoader {
    // 先从全局设置对应scope中获取配置
    const scope = this.compoundScope(this);
    const scopeName = getScopeName(scope);
    let config: ResourceLoader = getGlobalConfig(ConfigName.resourceLoader, scopeName);

    if (!config && this.type !== BaseType.root) {
      config = this.parent.getResourceLoader();
    }

    return config;
  }

  setResourceLoader(resourceLoader: ResourceLoader, scopes?: UsingScope[]) {
    setResourceLoader(resourceLoader, resourceLoader?.scopes || scopes || [this.compoundScope(this)]);
  }

  getPageContainer(): Element {
    let config: Element;

    // 先从全局设置对应scope中获取配置
    const scope = this.compoundScope(this);
    const scopeName = getScopeName(scope);
    config = getGlobalConfig(ConfigName.pageContainer, scopeName);

    // 再从缓存数据中获取
    if (config === undefined) {
      config = this.getData(DataName.pageContainer) as Element;
    }

    if (!config && this.type !== BaseType.root) {
      config = this.parent.getPageContainer();
    }

    return config;
  }

  setPageContainer(pageContainer: Element, scopes?: UsingScope[]) {
    setPageContainer(pageContainer, scopes || [this.compoundScope(this)]);
  }

  getRender(): Render {
    // 先从全局设置对应scope中获取配置
    const scope = this.compoundScope(this);
    const scopeName = getScopeName(scope);
    let config: Render = getGlobalConfig(ConfigName.render, scopeName);

    if (!config && this.type !== BaseType.root) {
      config = this.parent.getRender();
    }

    return config;
  }

  setRender(render: Render, scopes?: UsingScope[]) {
    setRender(render, scopes || [this.compoundScope(this)]);
  }

  getRouterType() {
    return this.getData(DataName.routerType, true) as RouterType;
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
