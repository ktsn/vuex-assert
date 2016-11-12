import { Store } from 'vuex'
import { Assertion, AssertionOptions } from './assertion'
import { and, object } from './helpers'
import { formatErrors } from './formatter'
import { mapValues, warn } from './utils'

export interface PluginOptions extends AssertionOptions {}

declare module 'vuex' {
  interface StoreOptions<S> {
    assertions?: { [key: string]: Assertion }
  }

  interface Module<S, R> {
    assertions?: { [key: string]: Assertion }
  }
}

export function assertPlugin (options: PluginOptions): (store: Store<any>) => void {
  const assertion = collectAssertions(options)

  return store => {
    assertState(assertion, store.state)
    store.subscribe((_, state) => {
      assertState(assertion, state)
    })
  }
}

function collectAssertions (module: AssertionOptions): Assertion {
  const assertions: Assertion[] = []

  if (module.assertions) {
    assertions.push(object(module.assertions))
  }

  if (module.modules) {
    const modulesAssertion = object(mapValues(module.modules, module => {
      return collectAssertions(module)
    }))
    assertions.push(modulesAssertion)
  }

  return and(assertions)
}

function assertState (
  assertion: Assertion,
  state: any
): void {
  const res = assertion.validate(state)
  if (!res.valid) {
    throw new Error('AssertionError:\n' + formatErrors(res.errors))
  }
}

