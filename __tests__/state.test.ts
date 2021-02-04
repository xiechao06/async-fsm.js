import { State } from "../lib/state";

test("name", () => {
  const state = new State("foo");
  expect(state.name).toBe("foo");
  // state.name.should.be.exactly("foo");
});

test("label", () => {
  const state = new State("foo");
  expect(state.label()).toBe("foo");
  expect(state.label("bar").label()).toBe("bar");
});

test("routes", () => {
  const state = new State("intact").routes({
    hit: "broken",
  });
  expect(state.routes().hit).toBe("broken");
  // state.routes().beat.should.be.exactly("bad");
});

test("transit", () =>
  new State("intact")
    .routes({
      hit: "broken",
    })
    .transit("hit")
    .then((state) => expect(state).toBe("broken"))
);

test("throw invalid op", () =>
  expect(new State("intact")
    .routes({
      hit: "broken",
    })
    .transit("beat"))
    .rejects
    .toMatchObject({
      op: "beat"
    })
);


test("ops", () =>
  expect(new State("intact")
    .routes({
      beat: {
        to: "bad",
        test() {
          return Promise.resolve(false);
        },
      },
    })
    .getOps())
    .resolves
    .toEqual([])
);
