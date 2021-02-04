import isEmpty from "is-empty";
import { FSMInvalidOp } from "./errors";
import { FsmInstance } from "./fsm";

type Callback<BundleType> = (
  this: State<BundleType>,
  fsmInstance: FsmInstance<BundleType>,
  context: {
    from: string;
    to: string;
    actionArgs?: unknown;
  }
) => Promise<unknown> | unknown;

export type Routes<BundleType> = Record<
  string,
  | {
      to: string;
      test?: (this: State<BundleType>, fsmInstance?: FsmInstance<BundleType>) => boolean | Promise<boolean>;
    }
  | string
>;

export class State<BundleType> {
  private _name: string;
  private _label?: string | ((this: State<BundleType>) => string);

  private _routes: Routes<BundleType>;

  private _onEnterCbs: Callback<BundleType>[];
  private _onLeaveCbs: Callback<BundleType>[];

  constructor(name: string) {
    this._name = name;
    this._routes = {};
    this._onEnterCbs = [];
    this._onLeaveCbs = [];
  }

  get name(): string {
    return this._name;
  }

  label(): string;
  label(arg: string): State<BundleType>;
  label(arg?: string): string | State<BundleType> {
    if (arg !== void 0) {
      this._label = arg;
      return this;
    }
    if (typeof this._label === "function") {
      return this._label.apply(this);
    }
    return this._label || this.name;
  }

  routes(): Routes<BundleType>;
  routes(arg: Routes<BundleType>): State<BundleType>;
  routes(arg?: Routes<BundleType>): Routes<BundleType> | State<BundleType> {
    if (arg === void 0) {
      return this._routes;
    }
    this._routes = arg;
    return this;
  }

  async transit(op: string): Promise<string> {
    const ret = this._routes[op];
    if (!ret) {
      throw new FSMInvalidOp(op, this);
    }
    if (typeof ret === "object" && typeof ret.test === "function") {
      if (!(await Promise.resolve(ret.test.apply(this)))) {
        throw new FSMInvalidOp(op, this);
      }
    }
    return typeof ret === "object" ? ret.to : ret;
  }

  onEnter(arg: Callback<BundleType>): State<BundleType> {
    this._onEnterCbs.push(arg);
    return this;
  }

  get onEnterCbs(): Callback<BundleType>[] {
    return this._onEnterCbs;
  }

  onLeave(arg: Callback<BundleType>): State<BundleType> {
    this._onLeaveCbs.push(arg);
    return this;
  }

  get onLeaveCbs(): Callback<BundleType>[] {
    return this._onLeaveCbs;
  }

  get terminated(): boolean {
    return isEmpty(this._routes);
  }

  async getOps(): Promise<string[]> {
    const ret = [];
    for (const k in this._routes) {
      const route = this._routes[k];
      if (typeof route === "string") {
        ret.push(k);
      } else if (typeof route.test === "function") {
        if (await Promise.resolve(route.test.apply(this))) {
          ret.push(k);
        }
      }
    }
    return ret;
  }
}
