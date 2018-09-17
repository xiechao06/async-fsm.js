const State = require('../state')
const { FSMInvalidOp } = require('../errors')
require('should')

describe('state', function () {
  it('name', () => {
    let state = new State('foo')
    state.name().should.be.exactly('foo')
    state.name('bar').name().should.be.exactly('bar')
  })

  it('routes', () => {
    let state = new State('good')
      .routes({
        beat: 'bad'
      })

    state.routes().beat.should.be.exactly('bad')
  })

  it('transit', () => {
    new State('good')
      .routes({
        beat: 'bad'
      })
      .transit('beat')
      .should.be.exactly('bad')

    ;(function () {
      new State('good')
        .routes({
          beat: 'bad'
        })
        .transit('hit')
    }).should.throw(FSMInvalidOp)
  })
})
