import isEmpty from "is-empty";
import { FSMInvalidOp } from "./errors";
import { FsmInstance } from "./fsm";

type Callback<
  NameType extends string | number | symbol,
  OpType extends string | number | symbol,
  BundleType
> = (
  this: State<NameType, OpType, BundleType>,
  fsmInstance: FsmInstance<NameType, OpType, BundleType>,
  context: {
    from: NameType;
    to: NameType;
    actionArgs?: unknown;
  }
) => Promise<unknown> | unknown;

export type Routes<
  NameType extends string | number | symbol = string,
  OpType extends string | number | symbol = string,
  BundleType = unknown
> = Record<
  OpType,
  | {
      to: NameType;
      test?: (
        this: State<NameType, OpType, BundleType>,
        fsmInstance?: FsmInstance<NameType, OpType, BundleType>
      ) => boolean | Promise<boolean>;
    }
  | NameType
>;

export class State<
  NameType extends string | number | symbol = string,
  OpType extends string | number | symbol = string,
  BundleType = unknown
> {
  private _name: NameType;
  private _label?: string | ((this: State<NameType, OpType, BundleType>) => string);

  private _routes: Routes<NameType, OpType, BundleType>;

  private _onEnterCbs: Callback<NameType, OpType, BundleType>[];
  private _onLeaveCbs: Callback<NameType, OpType,BundleType>[];

  constructor(name: NameType) {
    this._name = name;
    this._routes = {} as Routes<NameType, OpType, BundleType>;
    this._onEnterCbs = [];
    this._onLeaveCbs = [];
  }

  get name(): NameType {
    return this._name;
  }

  label(): string;
  label(arg: string): State<NameType, OpType, BundleType>;
  label(arg?: string): string | State<NameType, OpType, BundleType> {
    if (arg !== void 0) {
      this._label = arg;
      return this;
    }
    if (typeof this._label === "function") {
      return this._label.apply(this);
    }
    return this._label || this.name + "";
  }

  routes(): Routes<NameType, OpType, BundleType>;
  routes(arg: Routes<NameType, OpType, BundleType>): State<NameType, OpType, BundleType>;
  routes(
    arg?: Routes<NameType, OpType, BundleType>
  ): Routes<NameType, OpType, BundleType> | State<NameType, OpType, BundleType> {
    if (arg === void 0) {
      return this._routes;
    }
    this._routes = arg;
    return this;
  }

  async transit(op: OpType): Promise<NameType> {
    const ret = this._routes[op];
    if (!ret) {
      throw new FSMInvalidOp(op, this);
    }
    if (typeof ret === "object" && typeof ret.test === "function") {
      if (!(await Promise.resolve(ret.test.apply(this)))) {
        throw new FSMInvalidOp(op, this);
      }
    }
    return typeof ret === "object" ? ret.to : ret as NameType;
  }

  onEnter(arg: Callback<NameType, OpType, BundleType>): State<NameType, OpType, BundleType> {
    this._onEnterCbs.push(arg);
    return this;
  }

  get onEnterCbs(): Callback<NameType, OpType, BundleType>[] {
    return this._onEnterCbs;
  }

  onLeave(arg: Callback<NameType, OpType, BundleType>): State<NameType, OpType, BundleType> {
    this._onLeaveCbs.push(arg);
    return this;
  }

  get onLeaveCbs(): Callback<NameType, OpType, BundleType>[] {
    return this._onLeaveCbs;
  }

  get terminated(): boolean {
    return isEmpty(this._routes);
  }

  async getOps(): Promise<OpType[]> {
    const ret = [];
    for (const k in this._routes) {
      const nextState = this._routes[k];
      if (typeof nextState !== "object") {
        ret.push(k);
      } else if (typeof nextState.test === "function") {
        if (await Promise.resolve(nextState.test.apply(this))) {
          ret.push(k);
        }
      }
    }
    return ret;
  }
}
