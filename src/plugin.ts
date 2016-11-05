import { Store } from 'vuex'
import { Assertion, AssertionOptions } from './assertion'
import { and, object } from './helpers'
import { mapValues, reduce, isObject, warn } from './utils'

interface PluginOptions extends AssertionOptions {}

declare module 'vuex' {
  interface StoreOptions<S> {
    assertions?: { [key: string]: Assertion }
  }

  interface Module<S, R> {
    assertions?: { [key: string]: Assertion }
  }
}

export function assertPlugin (options: PluginOptions): (store: Store<any>) => void {
  const assertion = collectAssertions(options, [])

  return store => {
    assertState(assertion, store.state)
    store.subscribe((_, state) => {
      assertState(assertion, state)
    })
  }
}

function collectAssertions (
  module: AssertionOptions,
  path: string[]
): Assertion {
  const assertions: Assertion[] = []

  if (module.assertions) {
    assertions.push(object(module.assertions))
  }

  if (module.modules) {
    const modulesAssertion = object(mapValues(module.modules, module => {
      return collectAssertions(module, path)
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
    res.errors.forEach(error => {
      warn(
        'state' + formatPath(error.path) +
        ' == ' + JSON.stringify(error.actual) +
        ', ' + error.message
      )
    })
  }
}

function formatPath (path: (string | number)[]): string {
  let cur = path[0], i = 0, buf = '', transform: (value: string) => string

  const next = () => {
    buf += transform(String(cur))
    i += 1
    cur = path[i]
  }

  const isIndex = (value: string | number) => typeof value === 'number'
  const index = (value: string) => '[' + value + ']'
  const key = (value: string) => '.' + value

  while (cur != null) {
    transform = isIndex(cur) ? index : key
    next()
  }
  return buf
}
