import * as assert from 'power-assert'
import * as sinon from 'sinon'
import * as Vue from 'vue'
import * as Vuex from 'vuex'
import {
  plugin,
  number,
  string,
  boolean,
  object
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

    const store = new Vuex.Store({
      state: {
        value: 1
      },
      assertions,
      plugins: [plugin({ assertions })]
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
        plugin({ modules })
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
        plugin({ modules })
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
        plugin({ modules })
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
        plugin({ modules })
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
})
