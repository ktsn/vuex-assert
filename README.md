# vuex-assert
[![npm version](https://badge.fury.io/js/vuex-assert.svg)](https://badge.fury.io/js/vuex-assert)
[![Build Status](https://travis-ci.org/ktsn/vuex-assert.svg?branch=master)](https://travis-ci.org/ktsn/vuex-assert)

Assertion for Vuex state

## Examples

Just add `assertions` into your Vuex modules.

```js
// modules/users.js
import {
  boolean,
  number,
  string,
  object,
  array
} from 'vuex-assert'

export default {
  state: {
    isLoading: false,
    error: null,
    users: []
  },

  assertions: {
    isLoading: boolean,
    error: object({
      code: number,
      message: string
    }).optional,
    users: array(object({
      id: number.assert(id => id > 0, 'id should be unsigned'),
      name: string
    }))
  },

  // ... module getters, actions and mutations ...
}
```

Add `assertPlugin` to plugins option of `Vuex.Store` with your modules.

```js
import Vuex from 'vuex'
import modules from './modules'
import { assertPlugin } from 'vuex-assert'

const store = new Vuex.Store({
  modules,
  plugins: [
    assertPlugin({ modules })
  ]
})
```

Then, the store state will be validated for every mutation. Like following message will be printed if the assertion is failed.

```
[vuex-assert] state.users.error.code == null, number is expected
```

## API

- class Assertion
  - `optional: Assertion`

    Get assertion for optional type of this assertion.

  - `assert(fn: (value: any) => boolean, message?: string): Assertion`

    Include additional assertion for this assertion.

- `assertPlugin(options): VuexPlugin`

  Create Vuex plugin with options.

  - `options.assertions: { [key: string]: Assertion }`
  - `options.modules: { [key: string]: VuexModule }`

- `assert(fn: (value: any) => boolean, message?: string): Assertion`

  Create new assertion.

- `number: Assertion`

  Assertion for number.

- `string: Assertion`

  Assertion for string.

- `boolean: Assertion`

  Assertion for boolean.

- `optional: Assertion`

  Assertion for null or undefined.

- `object(assertions?: { [key: string]: Assertion }, message?: string): Assertion`

  Create assertion for object with properties assertions.

- `array(assertion?: Assertion, message?: string): Assertion`

  Create assertion for array with items assertions.

- `and(assertions: Assertion[]): Assertion`

  Intersect given assertions.

- `or(assertions: Assertion[]): Assertion`

  Union given assertions.

## License

MIT
