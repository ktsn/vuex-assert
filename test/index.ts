import * as assert from 'power-assert'
import * as sinon from 'sinon'
import * as Vue from 'vue'
import * as Vuex from 'vuex'
import {
  plugin,
  number,
  string,
  boolean
} from '../src/index'

let _message: string
console.error = message => {
  _message = message
}

describe('vuex-assert', () => {
  Vue.use(Vuex)

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
        plugin({ modules })
      ]
    })

    store.commit('a', '1')
    assert(/state\.foo\.a must be number, but actual value is "1"/.test(_message))

    store.commit('b', false)
    assert(/state\.foo\.b must be string, but actual value is false/.test(_message))

    store.commit('c', { bar: 1 })
    assert(/state\.foo\.c must be boolean, but actual value is {"bar":1}/.test(_message))
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
    assert(/state\.foo\.value must be number, but actual value is null/.test(_message))

    store.commit('update', undefined)
    assert(/state\.foo\.value must be number, but actual value is undefined/.test(_message))
  })
})
