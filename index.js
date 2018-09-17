const State = require('./state')
const { FSMUnknownState } = require('./errors')
const isEmpty = require('is-empty')
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

  addState (state) {
    if (typeof state === 'function') {
      let stateObj = new State()
      state.apply(this, [stateObj])
      state = stateObj
    } else if (typeof state === 'string') {
      state = new State(state)
    }
    this._states[state.name()] = state
    return this
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
    return this._states(state)
  }

  perform (op, onLeaveCb, onEnterCb) {
    if (!this._state) {
      throw new Error('State is empty, do you forget to set the initialize state?')
    }
    let oldState = this._state
    this._state = this._states[this._state].transit(op)
    if (!this._states.hasOwnProperty(this._state)) {
      throw new FSMUnknownState(this._state)
    }
    let onLeaveCbs = this._states[oldState].onLeaveCbs
    if (!isEmpty(onLeaveCbs)) {
      Promise.all(onLeaveCbs.map(it => it.apply(this, [{
        from: oldState,
        to: this._state
      }])))
        .then(it => typeof onEnterCb === 'function' && onEnterCb(null, it))
        .catch(err => typeof onEnterCb === 'function' && onEnterCb(err))
    }

    let state = this._states[this._state]
    let onEnterCbs = state.onEnterCbs
    if (!isEmpty(onEnterCbs)) {
      Promise.resolve(onEnterCbs.map(it => it.apply(this, [{
        from: oldState,
        to: this._state
      }])))
        .then(it => typeof onEnterCb === 'function' && onEnterCb(null, it))
        .catch(err => typeof onEnterCb === 'function' && onEnterCb(err))
    }
    return this
  }

  get terminated () {
    return this._states[this._state].terminated
  }
}

module.exports = { Fsm, State }
