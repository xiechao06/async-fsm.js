// const State = require('./lib/state')
// const Fsm = require('./lib/fsm')
// const errors = require('./lib/errors')

// module.exports = Object.assign({ Fsm, State }, errors)

export * from "./lib/errors";
export { Fsm } from "./lib/fsm";
export { State } from "./lib/state";

