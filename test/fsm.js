const { Fsm, State } = require('../')
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
})
