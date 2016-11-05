export function forEachValue <T>(
  obj: { [key: string]: T },
  fn: (value: T, key: string) => void
): void {
  Object.keys(obj).forEach(key => fn(obj[key], key))
}

export function mapValues <T, U>(
  obj: { [key: string]: T },
  fn: (value: T, key: string) => U
): { [key: string]: U } {
  const res: { [key: string]: U } = {}
  forEachValue(obj, (value, key) => {
    res[key] = fn(value, key)
  })
  return res
}

export function reduce <T, U>(
  obj: { [key: string]: T },
  fn: (acc: U, value: T, key: string) => U,
  initial: U
): U {
  let acc = initial
  forEachValue(obj, (value, key) => {
    acc = fn(acc, value, key)
  })
  return acc
}

export function isObject (value: any): boolean {
  return value !== null && typeof value === 'object'
}

export function warn (message: string): void {
  console.error('[vuex-assert] ' + message)
}
