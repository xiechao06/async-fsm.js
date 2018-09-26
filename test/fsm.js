const { Fsm, State } = require('../')
const sinon = require('sinon')
require('should-sinon')

require('should')

describe('fsm', () => {
  it('start state', () => {
    (function () {
      new Fsm().addState('started', true)
    }).should.throw(Error)
    let fsm = new Fsm()
      .addState(state => state
        .name('started')
        .routes({
          finish: 'ended'
        }), true)
    fsm.startState.name().should.be.equal('started')
  })

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

    return (async function () {
      await fsm
        .state('green')
        .perform('turnYellow')
      fsm.state().should.be.exactly('yellow')
      await fsm.perform('turnRed')
      fsm.state().should.be.exactly('red')
      await fsm.perform('close')
      fsm.state().should.be.exactly('closed')
    })()
  })

  it('terminated', () => {
    new Fsm()
      .addState('closed')
      .state('closed')
      .terminated.should.be.exactly(true)
  })

  it('throw invalid op', () => {
    new Fsm()
      .addState('closed')
      .state('closed')
      .perform('close')
      .should.be.rejectedWith(Error, { op: 'close' })

    new Fsm()
      .addState(function (state) {
        state.name('created')
          .routes({
            close: {
              to: 'closed',
              test () {
                throw new Error('foo')
              }
            }
          })
      })
      .addState('closed')
      .state('created')
      .perform('close')
      .should.be.rejectedWith(Error, { message: 'foo' })
  })

  it('throw unknown state', () => {
    (function () {
      new Fsm()
        .state('closed')
    })
      .should.throw(Error, { state: 'closed' })

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
      .should.be.rejectedWith(Error, { state: 'bar' })
  })

  it('on enter', () => {
    let onEnter1 = sinon.spy()
    let onEnter2 = sinon.spy()
    return new Fsm()
      .addState(function (state) {
        state
          .name('foo')
          .routes({
            a: 'bar'
          })
      })
      .addState(function (state) {
        state
          .name('bar')
          .onEnter(onEnter1)
          .onEnter(onEnter2)
      })
      .state('foo')
      .perform('a', {
        baz: 'baz'
      })
      .then(() => {
        onEnter1.should.be.calledWith({
          from: 'foo',
          to: 'bar',
          args: {
            baz: 'baz'
          }
        })
        onEnter2.should.be.calledWith({
          from: 'foo',
          to: 'bar',
          args: {
            baz: 'baz'
          }
        })
      })
  })

  it('on leave', () => {
    let onLeave1 = sinon.spy()
    let onLeave2 = sinon.spy()
    return new Fsm()
      .addState(function (state) {
        state
          .name('foo')
          .routes({
            a: 'bar'
          })
          .onLeave(onLeave1)
          .onLeave(onLeave2)
      })
      .addState(function (state) {
        state
          .name('bar')
      })
      .state('foo')
      .perform('a')
      .then(() => {
        onLeave1.should.be.calledWith({ from: 'foo', to: 'bar' })
        onLeave2.should.be.calledWith({ from: 'foo', to: 'bar' })
      })
  })

  it('available operations', () => {
    new Fsm()
      .addState(function (state) {
        state.name('foo')
          .routes({
            a: 'bar'
          })
      })
      .addState('bar')
      .state('foo')
      .ops
      .should.be.resolvedWith(['a'])

    new Fsm()
      .addState(function (state) {
        state.name('foo')
          .routes({
            a: { to: 'bar', test () { return Promise.resolve(false) } },
            b: { to: 'baz', test () { return true } }
          })
      })
      .addState('bar')
      .state('foo')
      .ops
      .should.be.resolvedWith(['b'])
  })
})
