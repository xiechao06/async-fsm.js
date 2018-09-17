const isEmpty = require('is-empty')

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

  get terminated () {
    return isEmpty(this._routes)
  }
}

module.exports = State
