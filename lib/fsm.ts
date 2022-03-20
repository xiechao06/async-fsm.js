import isEmpty from "is-empty";
import { FSMUnknownState } from "./errors";
import type { Routes } from "./state";
import { State } from "./state";

export class Fsm<
  NameType extends string | number | symbol = string,
  OpType extends string | number | symbol = string,
  BundleType = unknown
> {
  private _states = {} as Record<NameType, State<NameType, OpType, BundleType>>;
  private _startState?: State<NameType, OpType, BundleType>;

  get states(): Record<NameType, State<NameType, OpType, BundleType>> {
    return this._states;
  }

  addState(
    stateName: NameType | State<NameType, OpType, BundleType>
  ): Fsm<NameType, OpType, BundleType> {
    const state: State<NameType, OpType, BundleType> =
      typeof stateName === "object" ? stateName : new State(stateName);
    this._states[state.name] = state;
    if (typeof this._startState === "undefined") {
      this._startState = state;
    }
    return this;
  }

  get startState(): State<NameType, OpType, BundleType> | undefined {
    return this._startState;
  }

  createInstance(currentStateName?: NameType): FsmInstance<NameType, OpType, BundleType> {
    if (typeof this.startState === "undefined") {
      throw new Error("fsm must have a starting state to create a instance");
    }
    if (currentStateName === void 0) {
      currentStateName = this.startState.name;
    }
    return new FsmInstance(this, currentStateName as NameType);
  }

  getState(stateName: NameType): State<NameType, OpType, BundleType> {
    return this._states[stateName];
  }
}

export class FsmInstance<
  NameType extends string | number | symbol = string,
  OpType extends string | number | symbol = string,
  BundleType = unknown
> {
  private _fsm: Fsm<NameType, OpType, BundleType>;
  private _stateName: NameType;
  private _bundle?: BundleType;

  constructor(fsm: Fsm<NameType, OpType, BundleType>, currentStateName: NameType) {
    this._fsm = fsm;
    if (!Object.prototype.hasOwnProperty.call(this.states, currentStateName)) {
      throw new FSMUnknownState(currentStateName);
    }
    this._stateName = currentStateName;
  }

  bundle(): BundleType;
  bundle(arg: BundleType): FsmInstance<NameType, OpType, BundleType>;

  bundle(arg?: BundleType): unknown {
    if (arg !== void 0) {
      this._bundle = arg;
      return this;
    }
    return this._bundle;
  }

  get states(): Record<NameType, State<NameType, OpType, BundleType>> {
    return this._fsm.states;
  }

  /**
   * set/get current state
   * @param {string} arg state name
   */
  get state(): State<NameType, OpType, BundleType> {
    return this.states[this._stateName];
  }

  get terminated(): boolean {
    return this.states[this._stateName].terminated;
  }

  async perform<OnLeaveResult = unknown, OnEnterResult = unknown>(
    op: OpType,
    args?: unknown
  ): Promise<{
    onLeaveResults: OnLeaveResult[];
    onEnterResults: OnEnterResult[];
  }> {
    if (!this._stateName) {
      throw new Error(
        "Fsm has no state, do you forget to set the initialize state?"
      );
    }
    const originState = this.state;
    this._stateName = await this.state.transit(op);
    if (!Object.prototype.hasOwnProperty.call(this.states, this._stateName)) {
      throw new FSMUnknownState(this._stateName);
    }
    const onLeaveResults = [];
    if (!isEmpty(originState.onLeaveCbs)) {
      for (const cb of originState.onLeaveCbs) {
        onLeaveResults.push(
          (await Promise.resolve(
            cb.apply(originState, [
              this,
              {
                from: originState.name,
                to: this._stateName,
                ...(typeof args === "undefined" ? {} : { actionArgs: args }),
              },
            ])
          )) as OnLeaveResult
        );
      }
    }

    const onEnterResults = [];

    if (!isEmpty(this.state.onEnterCbs)) {
      for (const cb of this.state.onEnterCbs) {
        onEnterResults.push(
          (await Promise.resolve(
            cb.apply(this.state, [
              this,
              {
                from: originState.name,
                to: this._stateName,
                ...(typeof args === "undefined" ? {} : { actionArgs: args }),
              },
            ])
          )) as OnEnterResult
        );
      }
    }
    return {
      onLeaveResults,
      onEnterResults,
    };
  }

  getOps(): Promise<OpType[]> {
    if (!this._stateName) {
      throw new Error(
        "Fsm has no state, do you forget to set the initialize state?"
      );
    }
    return this.states[this._stateName].getOps();
  }

  async getRelevantStates(): Promise<{
    operables: Set<NameType>;
    reachables: Set<NameType>;
  }> {
    const operableStateSet = new Set<NameType>();
    const reachableStateSet = new Set<NameType>();
    for (const k in (this.states)) {
      const state = this.states[k];
      let operable = false;
      const routes: Routes<NameType, OpType, BundleType> = state.routes();
      for (const op in routes) {
        const nextState = routes[op];
        const reachable =
          typeof nextState !== "object" ||
          !nextState.test ||
          (await Promise.resolve(nextState.test.apply(state, [this])));
        if (reachable) {
          reachableStateSet.add(
            typeof nextState === "object" ? nextState.to: nextState as NameType,
          );
        }
        operable = operable || reachable;
      }
      operable && operableStateSet.add(state.name);
    }
    return {
      operables: operableStateSet,
      reachables: reachableStateSet,
    };
  }
}
