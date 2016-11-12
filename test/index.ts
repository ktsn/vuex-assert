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

  it('asserts initail state', () => {
    const assertions = {
      value: string
    }

    assert.throws(() => {
      new Vuex.Store({
        state: {
          value: 1
        },
        assertions,
        plugins: [assertPlugin({ assertions })]
      })
    }, /state\.value == 1\n\tstring is expected/)
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

    assert.throws(() => {
      store.commit('a', '1')
    }, /state\.foo\.a == "1"\n\tnumber is expected/)
    assert.throws(() => {
      store.commit('b', false)
    }, /state\.foo\.b == false\n\tstring is expected/)
    assert.throws(() => {
      store.commit('c', { bar: 1 })
    }, /state\.foo\.c == {"bar":1}\n\tboolean is expected/)
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

    assert.throws(() => {
      store.commit('update', null)
    }, /state\.foo\.value == null\n\tnumber is expected/)
    assert.throws(() => {
      store.commit('update', undefined)
    }, /state\.foo\.value == undefined\n\tnumber is expected/)
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

    assert.doesNotThrow(() => store.commit('update', null))
    assert.doesNotThrow(() => store.commit('update', undefined))
    assert.throws(() => {
      store.commit('update', 'str')
    }, /state\.foo\.value == "str"\n\tnumber is expected\n\tnull or undefined is expected/)
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

    assert.throws(() => {
      store.commit('update', {
        a: 1,
        b: {
          c: 2
        }
      })
    }, /state\.foo\.value\.b\.c == 2\n\tboolean is expected/)
  })

  it('asserts object itself', () => {
    const assertions = {
      value: object({
        a: string
      })
    }
    assert.throws(() => {
      new Vuex.Store({
        state: {
          value: 'not object'
        },
        assertions,
        plugins: [assertPlugin({ assertions })]
      })
    }, /state\.value == "not object"\n\tobject is expected/)
  })

  it('does not treat array as object', () => {
    const assertions = {
      value: object({
        a: string
      })
    }
    assert.throws(() => {
      new Vuex.Store({
        state: {
          value: ['string']
        },
        assertions,
        plugins: [assertPlugin({ assertions })]
      })
    }, /state\.value == \["string"\]\n\tobject is expected/)
  })

  it('asserts array items', () => {
    const assertions = {
      value: array(number)
    }
    assert.throws(() => {
      new Vuex.Store({
        state: {
          value: [1, 2, 'string', true, 5]
        },
        assertions,
        plugins: [assertPlugin({ assertions })]
      })
    }, /state\.value\[2\] == "string"\n\tnumber is expected\nstate\.value\[3\] == true\n\tnumber is expected/)
  })

  it('asserts array itself', () => {
    const assertions = {
      a: array(),
      b: array()
    }
    assert.throws(() => {
      new Vuex.Store({
        state: {
          a: 'string',
          b: [1, true, 'string', null]
        },
        assertions,
        plugins: [assertPlugin({ assertions })]
      })
    }, /state\.a == "string"\n\tarray is expected/)
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

    assert.throws(() => {
      store.commit('update', 10)
    }, /state\.value == 10\n\tvalue < 10/)
    assert.throws(() => {
      store.commit('update', 'str')
    }, /state\.value == "str"\n\tnumber is expected\n\tvalue < 10/)
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

    const expected = ['a\.value', 'a\.b\.value', 'a\.c\.value', 'a\.c\.d\.value']
      .map(path => `state\.${path} == null\n\tnumber is expected`)
      .join('[.\n]*')

    assert.throws(() => {
      store.commit('update', null)
    }, new RegExp(expected))
  })
})
