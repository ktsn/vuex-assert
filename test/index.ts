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

  let _message: string[]

  before(() => {
    console.error = message => {
      _message.push(message)
    }
  })

  beforeEach(() => {
    _message = []
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

    assert(/state\.value == 1, string is expected/.test(_message[0]))
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
          update: (state, n) => {
            state.a = n[0]
            state.b = n[1]
            state.c = n[2]
          }
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

    store.commit('update', ['1', false, { bar: 1 }])
    assert(/state\.foo\.a == "1", number is expected/.test(_message[0]))
    assert(/state\.foo\.b == false, string is expected/.test(_message[1]))
    assert(/state\.foo\.c == {"bar":1}, boolean is expected/.test(_message[2]))
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
    assert(/state\.foo\.value == null, number is expected/.test(_message[0]))

    store.commit('update', undefined)
    assert(/state\.foo\.value == undefined, number is expected/.test(_message[1]))
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
    assert(_message.length === 0)

    store.commit('update', undefined)
    assert(_message.length === 0)

    store.commit('update', 'str')
    assert(/state\.foo\.value == "str", number is expected/.test(_message[0]))
    assert(/state\.foo\.value == "str", null or undefined is expected/.test(_message[1]))
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
    assert(/state\.foo\.value\.b\.c == 2, boolean is expected/.test(_message[0]))
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
    assert(/state\.value == "not object", object is expected/.test(_message[0]))
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
    assert(/state\.value == \["string"\], object is expected/.test(_message[0]))
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
    assert(/state\.value\[2\] == "string", number is expected/.test(_message[0]))
    assert(/state\.value\[3\] == true, number is expected/.test(_message[1]))
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
    assert(/state\.a == "string", array is expected/.test(_message[0]))
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
    assert(/state\.value == 10, value < 10/.test(_message[0]))

    store.commit('update', 'str')
    assert(/state\.value == "str", number is expected/.test(_message[1]))
    assert(/state\.value == "str", value < 10/.test(_message[2]))
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
      const expected = new RegExp(`state.${path} == null, number is expected`)
      assert(expected.test(_message[i]))
    })
  })
})
