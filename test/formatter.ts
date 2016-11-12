import * as assert from 'power-assert'
import { formatErrors } from '../src/formatter'

declare function require (path: string): any

describe('formatter', () => {
  it('shows target path and actual value', () => {
    const actual = formatErrors([
      { path: ['foo', 'bar'], actual: 123, message: '' },
      { path: ['foo', 3, 'baz'], actual: true, message: '' },
      { path: [10, 'a', 'b'], actual: { test: 10 }, message: '' }
    ])
    assert(actual === require('./fixtures/simple.txt'))
  })
})
