import { AssertionError } from './assertion'

interface FormattedError {
  actual: any
  messages: string[]
}

export function formatErrors (errors: AssertionError[]): string {
  const formatted: { [key: string]: FormattedError } = {}
  errors.forEach(error => {
    const strPath = formatPath(error.path)
    if (!formatted[strPath]) {
      formatted[strPath] = {
        actual: error.actual,
        messages: []
      }
    }
    if (error.message !== '') {
      formatted[strPath].messages.push(error.message)
    }
  })

  return Object.keys(formatted)
    .map(path => {
      const { actual, messages } = formatted[path]
      let buf = `state${path} == ${JSON.stringify(actual)}`
      if (messages.length !== 0) {
        buf += '\n'
        buf += messages.map(m => '\t' + m).join('\n')
      }
      return buf
    })
    .join('\n')
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
