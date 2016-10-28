export function forEachValue <T>(
  obj: { [key: string]: T },
  fn: (value: T, key: string) => void
): void {
  Object.keys(obj).forEach(key => fn(obj[key], key))
}

export function warn (message: string): void {
  console.error('[vuex-assert] ' + message)
}
