class State {
  constructor (name) {
    this._name = name
  }

  name (arg) {
    if (arg !== void 0) {
      this._name = arg
      return this
    }
    return this._name
  }

  routes (arg) {
    if (arg === void 0) {
      return this._routes
    }
    this._routes = arg
    return this
  }

  transit (op) {
    return this._routes[op]
  }
}

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
    return this
  }

  perform (op) {
    this._state = this._states[this._state].transit(op)
    return this
  }
}

module.exports = { Fsm, State }
