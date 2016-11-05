import { assert, and, or, optional } from './helpers'

export interface AssertionResult {
  valid: boolean
  errors: AssertionError[]
}

export interface AssertionError {
  message: string
  path: (string | number)[]
  actual: any
}

export interface AssertionOptions {
  modules?: { [key: string]: AssertionOptions },
  assertions?: { [key: string]: Assertion }
}

export class Assertion {
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