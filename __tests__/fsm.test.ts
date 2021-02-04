import { Fsm, FSMUnknownState, State } from "../index";
import { FSMInvalidOp } from "../lib/errors";

test("start state", () => {
  const fsm = new Fsm().addState(new State("started")
    .routes({
      finish: "ended",
    })
  );
  expect(fsm.startState).not.toBeUndefined();
  expect(fsm.startState?.name).toBe("started");
});

test("bundle", () => {
  const fsm = new Fsm()
    .addState(new State("started")
      .routes({
        finish: "ended",
      })
    )
    .addState("ended");

  const fsmInstance = fsm.createInstance("started").bundle({ foo: "abc" });
  expect(fsmInstance.bundle()).toEqual({ foo: "abc" });
});

test("on leave", async () => {
  const onLeave1 = jest.fn(() => 1);
  const onLeave2 = jest.fn(() => 2);
  const fsmInstance = new Fsm()
    .addState(
      new State("intact")
        .routes({
          hit: "broken",
        })
        .onLeave(onLeave1)
        .onLeave(onLeave2)
    )
    .addState("broken")
    .createInstance()
  const {onLeaveResults} = await fsmInstance.perform<number>("hit", "with stick");
  expect(onLeaveResults).toEqual([1, 2]);
  expect(onLeave1).toBeCalledWith(fsmInstance, {
    from: "intact",
    to: "broken",
    actionArgs: "with stick",
  });
  expect(onLeave2).toBeCalledWith(fsmInstance, {
    from: "intact",
    to: "broken",
    actionArgs: "with stick",
  });
});

test("on enter", async () => {
  const onEnter1 = jest.fn(() => 1);
  const onEnter2 = jest.fn(() => 2);
  const fsmInstance =  new Fsm()
    .addState(
      new State("intact").routes({
        hit: "broken",
      })
    )
    .addState(new State("broken").onEnter(onEnter1).onEnter(onEnter2))
    .createInstance();
  const { onEnterResults } = await fsmInstance.perform<unknown, number>("hit", "with stick");
  expect(onEnterResults).toEqual([1, 2]);


  expect(onEnter1).toBeCalledWith(fsmInstance, {
    from: "intact",
    to: "broken",
    actionArgs: "with stick",
  });
  expect(onEnter2).toBeCalledWith(fsmInstance, {
    from: "intact",
    to: "broken",
    actionArgs: "with stick",
  });
});

test("terminated", () => {
  const instance = new Fsm().addState("closed").createInstance();
  expect(instance.terminated).toBe(true);
});

test("throw unknown state", () =>
  expect(
    new Fsm()
      .addState(new State("intact").
        routes({
          hit: "broken",
        })
      )
      .createInstance()
      .perform("hit")
  ).rejects.toBeInstanceOf(FSMUnknownState));

describe("available operations", () => {
  test("without test", async () => {
    const fsmInstance = await new Fsm()
      .addState(new State("intact")
        .routes({
          hit: "broken",
        })
      )
      .addState("broken")
      .createInstance();

    await expect(fsmInstance.getOps()).resolves.toEqual(["hit"]);
  });
  test("with test", () =>
    expect(
      new Fsm()
        .addState(new State("intact")
          .routes({
            hit: {
              to: "broken",
              test() {
                return Promise.resolve(false);
              },
            },
            touch: {
              to: "intact",
              test() {
                return true;
              },
            },
          })
        )
        .addState("broken")
        .createInstance()
        .getOps()
    ).resolves.toEqual(["touch"]));
});

test("throw invalid op", async () => {
  const instance = new Fsm().addState("closed").createInstance();

  await expect(instance.perform("close")).rejects.toBeInstanceOf(FSMInvalidOp);

  await expect(
    new Fsm()
      .addState(new State("intact")
        .routes({
          hit: {
            to: "broken",
            test() {
              return false;
            },
          },
        })
      )
      .addState("closed")
      .createInstance()
      .perform("close")
  ).rejects.toBeInstanceOf(FSMInvalidOp);
});

test("transition", async () => {
  const fsm = new Fsm()
    .addState(new State("green")
      .routes({
        turnYellow: "yellow",
        close: "closed",
      })
    )
    .addState(new State("yellow")
      .routes({
        turnRed: "red",
        close: "closed",
      })
    )
    .addState(new State("red")
      .routes({
        turnGree: "green",
        close: "closed",
      })
    )
    .addState("closed");

  const instance = fsm.createInstance();
  await instance.perform("turnYellow");
  expect(instance.state.name).toBe("yellow");
  await instance.perform("turnRed");
  expect(instance.state.name).toBe("red");
  await instance.perform("close");
  expect(instance.state.name).toBe("closed");
});

describe("relavant states", () => {
  test("without test", async () => {
    const instance = new Fsm()
      .addState(new State("started")
        .routes({
          finish: "completed",
        })
      )
      .addState("completed")
      .createInstance();
    const { reachable, operable } = await instance.getRelevantStates();
    expect(operable).toContain("started");
    expect(reachable).toContain("completed");
  });

  test("with test", async () => {
    const instance = new Fsm()
      .addState(new State("started")
        .routes({
          finish: {
            to: "completed",
            test(fsmInstance) {
              return Promise.resolve(fsmInstance?.bundle() === "bar");
            },
          },
        })
      )
      .createInstance()
      .bundle("foo");
    const { reachable, operable } = await instance.getRelevantStates();
    expect(reachable.size).toBe(0);
    expect(operable.size).toBe(0);
  });
});
