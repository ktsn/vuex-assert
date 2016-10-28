import { Store, ModuleTree } from 'vuex'
import { forEachValue, warn } from './utils'

interface AssertResult {
  valid: boolean
  expected?: string
  actual?: any
}

interface AssertOptions {
  modules?: ModuleTree<any>
  assertions?: { [key: string]: Assertion }
}

interface PluginOptions extends AssertOptions {}

declare module 'vuex' {
  interface Module<S, R> {
    assertions?: { [key: string]: Assertion }
  }
}

class Assertion {
  constructor (
    private fn: (value: any) => boolean,
    private expected: string
  ) {}

  validate (state: any): AssertResult {
    const res = this.fn(state)
    if (res) {
      return {
        valid: true
      }
    } else {
      return {
        valid: false,
        expected: this.expected,
        actual: state
      }
    }
  }
}

export function plugin (options: PluginOptions): (store: Store<any>) => void {
  return store => {
    store.subscribe((_, state) => {
      assertState(state, options, [])
    })
  }
}

function assertState (
  state: any,
  module: AssertOptions,
  path: string[]
): void {
  if (module.assertions) {
    const assertions = module.assertions
    forEachValue(assertions, (assertion, key) => {
      const res = assertion.validate(state[key])
      if (!res.valid) {
        warn(
          'state.' + path.concat(key).join('.') +
          ' must be ' + res.expected + ', but actual value is ' +
          JSON.stringify(res.actual)
        )
      }
    })
  }

  if (module.modules) {
    const modules = module.modules
    forEachValue(modules, (module, key) => {
      assertState(state[key], module, path.concat(key))
    })
  }
}

export const number = new Assertion(value => typeof value === 'number', 'number')
export const string = new Assertion(value => typeof value === 'string', 'string')
export const boolean = new Assertion(value => typeof value === 'boolean', 'boolean')
