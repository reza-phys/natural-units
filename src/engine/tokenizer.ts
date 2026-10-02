export type TokenType =
  | 'number'
  | 'ident'
  | 'op' // + - * / ^
  | 'lparen'
  | 'rparen'
  | 'convert' // in | to | ->
  | 'eof'

export interface Token {
  type: TokenType
  value: string
  pos: number
}

const IDENT_START = /[A-Za-zµμÅåΩω]/
const IDENT_PART = /[A-Za-z0-9_µμÅåΩω]/
const DIGIT = /[0-9]/

export class ParseError extends Error {}

export function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  const n = input.length

  while (i < n) {
    const ch = input[i]

    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i++
      continue
    }

    // Number: digits with optional decimal point and exponent.
    if (DIGIT.test(ch) || (ch === '.' && DIGIT.test(input[i + 1] ?? ''))) {
      const start = i
      while (i < n && DIGIT.test(input[i])) i++
      if (input[i] === '.') {
        i++
        while (i < n && DIGIT.test(input[i])) i++
      }
      if (input[i] === 'e' || input[i] === 'E') {
        // Lookahead so identifiers like "eV" right after a number aren't eaten.
        let j = i + 1
        if (input[j] === '+' || input[j] === '-') j++
        if (DIGIT.test(input[j] ?? '')) {
          i = j
          while (i < n && DIGIT.test(input[i])) i++
        }
      }
      tokens.push({ type: 'number', value: input.slice(start, i), pos: start })
      continue
    }

    // Identifier (unit, constant, function, or the word in/to).
    if (IDENT_START.test(ch)) {
      const start = i
      while (i < n && IDENT_PART.test(input[i])) i++
      const word = input.slice(start, i)
      if (word === 'in' || word === 'to') {
        tokens.push({ type: 'convert', value: word, pos: start })
      } else {
        tokens.push({ type: 'ident', value: word, pos: start })
      }
      continue
    }

    // Arrow convert operator.
    if (ch === '-' && input[i + 1] === '>') {
      tokens.push({ type: 'convert', value: '->', pos: i })
      i += 2
      continue
    }

    if ('+-*/^'.includes(ch)) {
      tokens.push({ type: 'op', value: ch, pos: i })
      i++
      continue
    }
    if (ch === '(') {
      tokens.push({ type: 'lparen', value: ch, pos: i })
      i++
      continue
    }
    if (ch === ')') {
      tokens.push({ type: 'rparen', value: ch, pos: i })
      i++
      continue
    }

    throw new ParseError(`unexpected character '${ch}' at position ${i}`)
  }

  tokens.push({ type: 'eof', value: '', pos: n })
  return tokens
}
