const isEmpty = require('is-empty')
const { FSMInvalidOp } = require('./errors')

class State {
  constructor (name) {
    this._name = name
    this._routes = {}
    this._onEnterCbs = []
    this._onLeaveCbs = []
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

  async transit (op) {
    let ret = this._routes[op]
    if (!ret) {
      throw new FSMInvalidOp(op)
    }
    if (typeof ret === 'object' && typeof ret.test === 'function') {
      let test = await Promise.resolve(ret.test.apply(this, [op]))
      if (!test) {
        throw new FSMInvalidOp(op)
      }
    }
    return typeof ret === 'object' ? ret.to : ret
  }

  onEnter (arg) {
    this._onEnterCbs.push(arg)
    return this
  }

  get onEnterCbs () {
    return this._onEnterCbs
  }

  onLeave (arg) {
    this._onLeaveCbs.push(arg)
    return this
  }

  get onLeaveCbs () {
    return this._onLeaveCbs
  }

  get terminated () {
    return isEmpty(this._routes)
  }

  get ops () {
    return (async function (state) {
      let ret = []
      for (let k in state._routes) {
        let route = state._routes[k]
        if (typeof route === 'string') {
          ret.push(k)
        }
        if (typeof route.test === 'function') {
          try {
            let b = await route.test.apply(state, [route.to])
            b && ret.push(k)
          } catch (e) {
          }
        }
      }
      return ret
    })(this)
  }
}

module.exports = State
