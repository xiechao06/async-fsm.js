
class FSMInvalidOp extends Error {
  constructor (op) {
    super('Invalid operation: ' + op)
    this._op = op
  }
}

module.exports = {
  FSMInvalidOp
}
