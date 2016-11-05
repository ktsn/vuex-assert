import { Assertion, AssertionResult } from './assertion'
import { mapValues, reduce, isObject } from './utils'

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

export function and (assertions: Assertion[]): Assertion {
  return compose(assertions, (a, b) => a && b, true)
}

export function or (assertions: Assertion[]): Assertion {
  return compose(assertions, (a, b) => a || b, false)
}

export const number = assert(value => typeof value === 'number', 'number is expected')
export const string = assert(value => typeof value === 'string', 'string is expected')
export const boolean = assert(value => typeof value === 'boolean', 'boolean is expected')
export const optional = assert(value => value == null, 'null or undefined is expected')
