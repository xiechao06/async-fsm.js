
class FSMInvalidOp extends Error {
  constructor (op) {
    super('Invalid operation: ' + op)
    this.op = op
  }
}

class FSMUnknownState extends Error {
  constructor (state) {
    super('Unkown state: ' + state)
    this.state = state
  }
}

module.exports = {
  FSMInvalidOp, FSMUnknownState
}
