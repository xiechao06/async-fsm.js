const { FSMUnknownState } = require('./errors')
const isEmpty = require('is-empty')
const State = require('./state')

class Fsm {
  constructor () {
    this._states = {}
  }

  /**
   * set or get the bundle of fsm
   * @param {*} arg
   */
  bundle (arg) {
    if (arg !== void 0) {
      this._bundle = arg
      return this
    }
    return this._bundle
  }

  get ops () {
    if (!this._state) {
      throw new Error('Fsm has no state, do you forget to set the initialize state?')
    }
    return this._states[this._state].ops
  }

  addState (state, isStartState = false) {
    if (typeof state === 'function') {
      let stateObj = new State()
      state.apply(this, [stateObj])
      state = stateObj
    } else if (typeof state === 'string') {
      state = new State(state)
    }
    this._states[state.name()] = state
    if (isStartState) {
      if (isEmpty(state.routes())) {
        throw new Error('start state must have routes')
      }
      this._startState = state
    }
    return this
  }

  get startState () {
    return this._startState
  }

  /**
   * set/get current state
   * @param {string} arg state name
   */
  state (arg) {
    if (arg === void 0) {
      return this._state
    }
    this._state = arg
    if (!this._states.hasOwnProperty(arg)) {
      throw new FSMUnknownState(arg)
    }
    return this
  }

  getState (state) {
    return this._states[state]
  }

  async perform (op, args) {
    if (!this._state) {
      throw new Error('Fsm has no state, do you forget to set the initialize state?')
    }
    let oldState = this._state
    this._state = await this._states[this._state].transit(op)
    if (!this._states.hasOwnProperty(this._state)) {
      throw new FSMUnknownState(this._state)
    }
    let onLeaveCbs = this._states[oldState].onLeaveCbs
    if (!isEmpty(onLeaveCbs)) {
      await Promise.all(onLeaveCbs.map(it => it.apply(this, [{
        from: oldState,
        to: this._state,
        ...(args ? { args } : {})
      }])))
    }

    let state = this._states[this._state]
    let onEnterCbs = state.onEnterCbs
    if (!isEmpty(onEnterCbs)) {
      await Promise.resolve(onEnterCbs.map(it => it.apply(this, [{
        from: oldState,
        to: this._state,
        ...(args ? { args } : {})
      }])))
    }
    return this
  }

  get terminated () {
    return this._states[this._state].terminated
  }
}

module.exports = Fsm
