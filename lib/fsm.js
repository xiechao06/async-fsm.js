const { FSMUnknownState } = require('./errors')
const isEmpty = require('is-empty')
const State = require('./state')

class Fsm {
  constructor () {
    this._states = {}
  }

  get states () {
    return this._states
  }

  get availableStates () {

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

  createInstance (state) {
    return new FsmInstance(this, state)
  }

  getState (state) {
    return this._states[state]
  }
}

class FsmInstance {
  constructor (fsm, stateName) {
    this._fsm = fsm
    if (!this.states.hasOwnProperty(stateName)) {
      throw new FSMUnknownState(stateName)
    }
    this._stateName = stateName
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

  get states () {
    return this._fsm.states
  }

  /**
   * set/get current state
   * @param {string} arg state name
   */
  get state () {
    return this.states[this._stateName]
  }

  get terminated () {
    return this.states[this._stateName].terminated
  }

  async perform (op, args) {
    if (!this._stateName) {
      throw new Error('Fsm has no state, do you forget to set the initialize state?')
    }
    let oldStateName = this._stateName
    this._stateName = await this.states[this._stateName].transit(op)
    if (!this.states.hasOwnProperty(this._stateName)) {
      throw new FSMUnknownState(this._stateName)
    }
    let onLeaveCbs = this.states[oldStateName].onLeaveCbs
    if (!isEmpty(onLeaveCbs)) {
      await Promise.all(onLeaveCbs.map(it => it.apply(this, [{
        from: oldStateName,
        to: this._stateName,
        ...(args ? { args } : {})
      }])))
    }

    let state = this.states[this._stateName]
    let onEnterCbs = state.onEnterCbs
    if (!isEmpty(onEnterCbs)) {
      await Promise.resolve(onEnterCbs.map(it => it.apply(this, [{
        from: oldStateName,
        to: this._stateName,
        ...(args ? { args } : {})
      }])))
    }
    return this
  }

  get ops () {
    if (!this._stateName) {
      throw new Error('Fsm has no state, do you forget to set the initialize state?')
    }
    return this.states[this._stateName].ops
  }
}

module.exports = Fsm
