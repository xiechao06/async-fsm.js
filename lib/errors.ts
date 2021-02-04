import {State} from './state';

export class FSMInvalidOp<BundleType> extends Error {

  private op: string;
  private state: State<BundleType>;

  constructor (op: string, state: State<BundleType>) {
    super(`Invalid operation: "${op}" is not allowed in state "${state.name}"`)
    this.op = op
    this.state = state
  }
}

export class FSMUnknownState extends Error {
  public stateName: string;

  constructor (stateName: string) {
    super('Unkown state: ' + stateName);
    this.stateName = stateName;
  }
}
