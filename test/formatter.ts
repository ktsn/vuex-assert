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

  it('shows assertion messages', () => {
    const actual = formatErrors([
      { path: ['foo'], actual: 123, message: 'string is expected' },
      { path: ['bar'], actual: null, message: '' },
      { path: ['baz'], actual: 'hello', message: 'number is expected' },
      { path: ['baz'], actual: 'hello', message: 'null or undefined is expected' }
    ])
    assert(actual === require('./fixtures/message.txt'))
  })
})
