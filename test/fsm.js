const { Fsm, State } = require('../')
const { FSMInvalidOp, FSMUnknownState } = require('../errors')

require('should')

describe('fsm', () => {
  it('bundle', () => {
    let fsm = new Fsm()
    fsm.bundle({
      foo: 'abc'
    })
    fsm.bundle().should.have.property('foo')
    fsm.bundle().foo.should.be.exactly('abc')
  })
  it('transition', () => {
    let fsm = new Fsm()
      .addState(function (state) {
        state
          .name('green')
          .routes({
            turnYellow: 'yellow',
            close: 'closed'
          })
      })
      .addState(new State()
        .name('yellow')
        .routes({
          turnRed: 'red',
          close: 'closed'
        })
      )
      .addState(function (state) {
        state
          .name('red')
          .routes({
            turnGree: 'green',
            close: 'closed'
          })
      })
      .addState('closed')

    fsm
      .state('green')
      .perform('turnYellow')
      .state().should.be.exactly('yellow')

    fsm.perform('turnRed')
      .state().should.be.exactly('red')

    fsm
      .perform('close')
      .state().should.be.exactly('closed')
  })

  it('terminated', () => {
    new Fsm()
      .addState('closed')
      .state('closed')
      .terminated.should.be.exactly(true)
  })

  it('throw invalid op', () => {
    (function () {
      new Fsm()
        .addState('closed')
        .state('closed')
        .perform('close')
    })
      .should.throw(Error, { op: 'close' })
  })

  it('throw unknown state', () => {
    (function () {
      new Fsm()
        .state('closed')
    })
      .should.throw(Error, { state: 'closed' })

    ;(function () {
      new Fsm()
        .addState(function (state) {
          state
            .name('foo')
            .routes({
              a: 'bar'
            })
        })
        .state('foo')
        .perform('a')
    })
      .should.throw(Error, { state: 'bar' })
  })
})
