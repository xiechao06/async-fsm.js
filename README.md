
# async-fsm.js

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

a finite state machine implementation

## Quick Start

```bash
npm i async-fsm.js
```

## Test

```bash
npm run test
```

## Features

* asynchronous onEnter, onLeave hooks
* asynchronous check if operation is available
* available operations
* comprehensive error checking

## Example

```javascript
const { Fsm } = require('async-fsm.js')
const fsm = new Fsm()
  .addState(new State("started")
    .routes({
      finish: "ended",
    })
  )
  .addState("ended");

const fsmInstance = fsm.createInstance("started").bundle({ foo: "abc" });
await fsmInstance.perform('finish');
expect(fsmInstance.state.name).toBe('ended');
```

please check test for more examples.
