# vuex-assert

Assertion for Vuex state

## Examples

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

## License

MIT
