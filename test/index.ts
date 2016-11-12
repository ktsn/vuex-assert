import * as assert from 'power-assert'
import * as Vue from 'vue'
import * as Vuex from 'vuex'
import {
  assertPlugin,
  number,
  string,
  boolean,
  object,
  array
} from '../src/index'

describe('vuex-assert', () => {
  Vue.use(Vuex)

  let _message: string = ''

  before(() => {
    console.error = message => {
      _message = message
    }
  })

  beforeEach(() => {
    _message = ''
  })

  it('asserts initail state', () => {
    const assertions = {
      value: string
    }

    new Vuex.Store({
      state: {
        value: 1
      },
      assertions,
      plugins: [assertPlugin({ assertions })]
    })

    assert(/state\.value == 1\n\tstring is expected/.test(_message))
  })

  it('asserts primitive', () => {
    const modules = {
      foo: {
        state: {
          a: 1,
          b: 'str',
          c: true
        },
        mutations: {
          a: (state, n) => state.a = n,
          b: (state, n) => state.b = n,
          c: (state, n) => state.c = n
        },
        assertions: {
          a: number,
          b: string,
          c: boolean
        }
      }
    }

    const store = new Vuex.Store({
      modules,
      plugins: [
        assertPlugin({ modules })
      ]
    })

    store.commit('a', '1')
    assert(/state\.foo\.a == "1"\n\tnumber is expected/.test(_message))
    store.commit('b', false)
    assert(/state\.foo\.b == false\n\tstring is expected/.test(_message))
    store.commit('c', { bar: 1 })
    assert(/state\.foo\.c == {"bar":1}\n\tboolean is expected/.test(_message))
  })

  it('disallow null and undefined', () => {
    const modules = {
      foo: {
        state: { value: 1 },
        assertions: { value: number },
        mutations: {
          update: (state, n) => state.value = n
        }
      }
    }

    const store = new Vuex.Store({
      modules,
      plugins: [
        assertPlugin({ modules })
      ]
    })

    store.commit('update', null)
    assert(/state\.foo\.value == null\n\tnumber is expected/.test(_message))

    store.commit('update', undefined)
    assert(/state\.foo\.value == undefined\n\tnumber is expected/.test(_message))
  })

  it('asserts optional value', () => {
    const modules = {
      foo: {
        state: { value: 1 },
        assertions: { value: number.optional },
        mutations: {
          update: (state, n) => state.value = n
        }
      }
    }

    const store = new Vuex.Store({
      modules,
      plugins: [
        assertPlugin({ modules })
      ]
    })

    store.commit('update', null)
    assert(_message === '')

    store.commit('update', undefined)
    assert(_message === '')

    store.commit('update', 'str')
    assert(/state\.foo\.value == "str"\n\tnumber is expected\n\tnull or undefined is expected/.test(_message))
  })

  it('asserts object value', () => {
    const modules = {
      foo: {
        state: {
          value: {
            a: 0,
            b: {
              c: false
            }
          }
        },
        assertions: {
          value: object({
            a: number,
            b: object({
              c: boolean
            })
          })
        },
        mutations: {
          update: (state, n) => state.value = n
        }
      }
    }

    const store = new Vuex.Store({
      modules,
      plugins: [
        assertPlugin({ modules })
      ]
    })

    store.commit('update', {
      a: 1,
      b: {
        c: 2
      }
    })
    assert(/state\.foo\.value\.b\.c == 2\n\tboolean is expected/.test(_message))
  })

  it('asserts object itself', () => {
    const assertions = {
      value: object({
        a: string
      })
    }
    new Vuex.Store({
      state: {
        value: 'not object'
      },
      assertions,
      plugins: [assertPlugin({ assertions })]
    })
    assert(/state\.value == "not object"\n\tobject is expected/.test(_message))
  })

  it('does not treat array as object', () => {
    const assertions = {
      value: object({
        a: string
      })
    }
    new Vuex.Store({
      state: {
        value: ['string']
      },
      assertions,
      plugins: [assertPlugin({ assertions })]
    })
    assert(/state\.value == \["string"\]\n\tobject is expected/.test(_message))
  })

  it('asserts array items', () => {
    const assertions = {
      value: array(number)
    }
    new Vuex.Store({
      state: {
        value: [1, 2, 'string', true, 5]
      },
      assertions,
      plugins: [assertPlugin({ assertions })]
    })
    assert(/state\.value\[2\] == "string"\n\tnumber is expected/.test(_message))
    assert(/state\.value\[3\] == true\n\tnumber is expected/.test(_message))
  })

  it('asserts array itself', () => {
    const assertions = {
      a: array(),
      b: array()
    }
    new Vuex.Store({
      state: {
        a: 'string',
        b: [1, true, 'string', null]
      },
      assertions,
      plugins: [assertPlugin({ assertions })]
    })
    assert(/state\.a == "string"\n\tarray is expected/.test(_message))
  })

  it('chains assertion', () => {
    const assertions = {
      value: number.assert(value => value < 10, 'value < 10')
    }
    const store = new Vuex.Store({
      state: {
        value: 5
      },
      mutations: {
        update: (state, n) => state.value = n
      },
      assertions,
      plugins: [assertPlugin({ assertions })]
    })

    assert(_message.length === 0)

    store.commit('update', 10)
    assert(/state\.value == 10\n\tvalue < 10/.test(_message))

    store.commit('update', 'str')
    assert(/state\.value == "str"\n\tnumber is expected\n\tvalue < 10/.test(_message))
  })

  it('asserts nested modules', () => {
    const mutations = {
      update: (state, n) => state.value = n
    }

    const modules = {
      a: {
        state: { value: 1 },
        assertions: { value: number },
        mutations,
        modules: {
          b: {
            state: { value: 2 },
            assertions: { value: number },
            mutations
          },
          c: {
            state: { value: 3 },
            assertions: { value: number },
            mutations,
            modules: {
              d: {
                state: { value: 4 },
                assertions: { value: number },
                mutations
              }
            }
          }
        }
      }
    }

    const store = new Vuex.Store({
      modules,
      plugins: [assertPlugin({ modules })]
    })

    assert(_message.length === 0)
    store.commit('update', null)
    ;['a.value', 'a.b.value', 'a.c.value', 'a.c.d.value'].forEach((path, i) => {
      const expected = new RegExp(`state.${path} == null\n\tnumber is expected`)
      assert(expected.test(_message))
    })
  })
})
