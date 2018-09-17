const isEmpty = require('is-empty')
const { FSMInvalidOp } = require('./errors')

class State {
  constructor (name) {
    this._name = name
    this._routes = {}
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
    let ret = this._routes[op]
    if (!ret) {
      throw new FSMInvalidOp(op)
    }
    return ret
  }

  get terminated () {
    return isEmpty(this._routes)
  }
}

module.exports = State
