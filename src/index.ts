import { Store, ModuleTree } from 'vuex'
import { mapValues, reduce, isObject, warn } from './utils'

interface AssertionResult {
  valid: boolean
  errors: AssertionError[]
}

interface AssertionError {
  message: string
  path: (string | number)[]
  actual: any
}

interface AssertionOptions {
  modules?: ModuleTree<any>
  assertions?: { [key: string]: Assertion }
}

interface PluginOptions extends AssertionOptions {}

declare module 'vuex' {
  interface StoreOptions<S> {
    assertions?: { [key: string]: Assertion }
  }

  interface Module<S, R> {
    assertions?: { [key: string]: Assertion }
  }
}

class Assertion {
  constructor (
    private fn: (value: any) => AssertionResult
  ) {}

  validate (state: any): AssertionResult {
    return this.fn(state)
  }

  assert (fn: (value: any) => boolean, message?: string): Assertion {
    return and([this, assert(fn, message)])
  }

  get optional (): Assertion {
    return or([this, optional])
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
  let cur = path[0], i = 0, buf = '', transform

  const next = () => {
    buf += transform(cur)
    i += 1
    cur = path[i]
  }

  const isIndex = value => typeof value === 'number'
  const index = value => '[' + value + ']'
  const key = value => '.' + value

  while (cur != null) {
    transform = isIndex(cur) ? index : key
    next()
  }
  return buf
}

export function assert (fn: (value: any) => boolean, message: string = ''): Assertion {
  return new Assertion(value => {
    const result: AssertionResult = {
      valid: fn(value),
      errors: []
    }
    if (!result.valid) {
      result.errors.push({
        message,
        path: [],
        actual: value
      })
    }
    return result
  })
}

function compose (assertions: Assertion[], fn: (a: boolean, b: boolean) => boolean, initial: boolean): Assertion {
    return new Assertion(value => {
    const result = assertions
      .map(a => a.validate(value))
      .reduce((acc, res) => {
        return {
          valid: fn(acc.valid, res.valid),
          errors: acc.errors.concat(res.errors)
        }
      }, {
        valid: initial,
        errors: []
      })

    if (result.valid) {
      result.errors = []
    }

    return result
  })
}

const optional = assert(value => value == null, 'null or undefined is expected')

export function and (assertions: Assertion[]): Assertion {
  return compose(assertions, (a, b) => a && b, true)
}

export function or (assertions: Assertion[]): Assertion {
  return compose(assertions, (a, b) => a || b, false)
}

export const number = assert(value => typeof value === 'number', 'number is expected')
export const string = assert(value => typeof value === 'string', 'string is expected')
export const boolean = assert(value => typeof value === 'boolean', 'boolean is expected')

export function object (assertions: { [key: string]: Assertion } = {}, message: string = 'object is expected'): Assertion {
  return new Assertion(value => {
    if (!isObject(value) || Array.isArray(value)) {
      return {
        valid: false,
        errors: [{
          message,
          path: [],
          actual: value
        }]
      }
    }

    const results = mapValues(assertions, (assertion, key) => {
      return assertion.validate(value[key])
    })

    return reduce(results, (acc, result, key) => {
      acc.valid = acc.valid && result.valid
      // prepend the key for the state path
      result.errors.forEach(error => error.path.unshift(key))
      acc.errors = acc.errors.concat(result.errors)
      return acc
    }, {
      valid: true,
      errors: []
    } as AssertionResult)
  })
}

export function array (assertion?: Assertion, message: string = 'array is expected'): Assertion {
  return new Assertion(value => {
    if (!Array.isArray(value)) {
      return {
        valid: false,
        errors: [{
          message,
          path: [],
          actual: value
        }]
      }
    }

    // skip type check for array items if Assertion is not specified
    if (!assertion) return { valid: true, errors: [] }

    return value
      .map(item => assertion.validate(item))
      .reduce((acc, result, index) => {
        acc.valid = acc.valid && result.valid
        // prepend the index for the state path
        result.errors.forEach(error => error.path.unshift(index))
        acc.errors = acc.errors.concat(result.errors)
        return acc
      }, {
        valid: true,
        errors: []
      } as AssertionResult)
  })
}