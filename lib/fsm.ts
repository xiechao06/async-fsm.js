import isEmpty from "is-empty";
import { FSMUnknownState } from "./errors";
import type { Routes } from "./state";
import { State } from "./state";

export class Fsm<BundleType = unknown> {
  private _states: Record<string, State<BundleType>>;
  private _startState?: State<BundleType>;

  constructor() {
    this._states = {};
  }

  get states(): Record<string, State<BundleType>> {
    return this._states;
  }

  addState(stateName: string | State<BundleType>): Fsm<BundleType> {
    const state: State<BundleType> =
      typeof stateName === "string" ? new State(stateName) : stateName;
    this._states[state.name] = state;
    if (typeof this._startState === "undefined") {
      this._startState = state;
    }
    return this;
  }

  get startState(): State<BundleType> | undefined {
    return this._startState;
  }

  createInstance(currentStateName?: string): FsmInstance<BundleType> {
    if (typeof this.startState === "undefined") {
      throw new Error("fsm must have a starting state to create a instance");
    }
    if (currentStateName === void 0) {
      currentStateName = this.startState.name;
    }
    return new FsmInstance<BundleType>(this, currentStateName as string);
  }

  getState(stateName: string): State<BundleType> {
    return this._states[stateName];
  }
}

export class FsmInstance<BundleType> {
  private _fsm: Fsm<BundleType>;
  private _stateName: string;
  private _bundle?: BundleType;

  constructor(fsm: Fsm<BundleType>, currentStateName: string) {
    this._fsm = fsm;
    if (!Object.prototype.hasOwnProperty.call(this.states, currentStateName)) {
      throw new FSMUnknownState(currentStateName);
    }
    this._stateName = currentStateName;
  }

  bundle(): BundleType;
  bundle(arg: BundleType): FsmInstance<BundleType>;

  bundle(arg?: BundleType): unknown {
    if (arg !== void 0) {
      this._bundle = arg;
      return this;
    }
    return this._bundle;
  }

  get states(): Record<string, State<BundleType>> {
    return this._fsm.states;
  }

  /**
   * set/get current state
   * @param {string} arg state name
   */
  get state(): State<BundleType> {
    return this.states[this._stateName];
  }

  get terminated(): boolean {
    return this.states[this._stateName].terminated;
  }

  async perform<OnLeaveResult = unknown, OnEnterResult = unknown>(
    op: string,
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

  getOps(): Promise<string[]> {
    if (!this._stateName) {
      throw new Error(
        "Fsm has no state, do you forget to set the initialize state?"
      );
    }
    return this.states[this._stateName].getOps();
  }

  async getRelevantStates(): Promise<{
    operable: Set<string>;
    reachable: Set<string>;
  }> {
    const operableStateSet = new Set<string>();
    const reachableStateSet = new Set<string>();
    for (const state of Object.values(this.states)) {
      let operable = false;
      const routes: Routes<BundleType> = state.routes();
      for (const op in routes) {
        const nextState = routes[op];
        const reachable =
          typeof nextState === "string" ||
          !nextState.test ||
          (await Promise.resolve(nextState.test.apply(state, [this])));
        if (reachable) {
          reachableStateSet.add(
            typeof nextState === "string" ? nextState : nextState.to
          );
        }
        operable = operable || reachable;
      }
      operable && operableStateSet.add(state.name);
    }
    return {
      operable: operableStateSet,
      reachable: reachableStateSet,
    };
  }
}
