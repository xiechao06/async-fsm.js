
class FSMInvalidOp extends Error {
  constructor (op, state) {
    super(`Invalid operation: ${op}, current state is ${state.name()}`)
    this.op = op
    this.state = state
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
