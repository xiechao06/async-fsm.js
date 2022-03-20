import {State} from './state';

export class FSMInvalidOp<NameType extends string | number | symbol,
OpType extends string | number | symbol,
BundleType> extends Error {

  private op: OpType;
  private state: State<NameType, OpType, BundleType>;

  constructor (op: OpType, state: State<NameType, OpType, BundleType>) {
    super(`Invalid operation: "${op}" is not allowed in state "${state.name}"`)
    this.op = op
    this.state = state
  }
}

export class FSMUnknownState<NameType extends string| number |symbol> extends Error {
  public stateName: NameType;

  constructor (stateName: NameType) {
    super('Unkown state: ' + stateName);
    this.stateName = stateName;
  }
}
