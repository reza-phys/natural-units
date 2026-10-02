import type { Node } from './ast'
import { FUNCTION_NAMES } from './functions'
import { ParseError, tokenize, type Token } from './tokenizer'

// Recursive-descent parser. Grammar (lowest to highest precedence):
//   convert := add ( ('in'|'to'|'->') add )?
//   add     := mul ( ('+'|'-') mul )*
//   mul     := unary ( ('*'|'/') unary | <implicit> unary )*
//   unary   := ('+'|'-') unary | pow
//   pow     := primary ( '^' unary )?        right-associative; exponent may be unary
//   primary := number | func '(' convert ')' | ident | '(' convert ')'
class Parser {
  private pos = 0
  private readonly tokens: Token[]
  private readonly input: string

  constructor(tokens: Token[], input: string) {
    this.tokens = tokens
    this.input = input
  }

  private peek(): Token {
    return this.tokens[this.pos]
  }
  private next(): Token {
    return this.tokens[this.pos++]
  }
  private expect(type: Token['type']): Token {
    const t = this.peek()
    if (t.type !== type) throw new ParseError(`expected ${type} but found '${t.value || 'end'}'`)
    return this.next()
  }

  parse(): Node {
    const node = this.parseConvert()
    if (this.peek().type !== 'eof') {
      throw new ParseError(`unexpected '${this.peek().value}'`)
    }
    return node
  }

  private parseConvert(): Node {
    const expr = this.parseAdd()
    if (this.peek().type === 'convert') {
      this.next()
      const start = this.peek().pos
      const target = this.parseAdd()
      const end = this.peek().pos
      const targetText = this.input.slice(start, end).trim()
      return { kind: 'convert', expr, target, targetText }
    }
    return expr
  }

  private parseAdd(): Node {
    let left = this.parseMul()
    while (this.peek().type === 'op' && (this.peek().value === '+' || this.peek().value === '-')) {
      const op = this.next().value as '+' | '-'
      const right = this.parseMul()
      left = { kind: 'binary', op, left, right }
    }
    return left
  }

  private parseMul(): Node {
    let left = this.parseUnary()
    for (;;) {
      const t = this.peek()
      if (t.type === 'op' && (t.value === '*' || t.value === '/')) {
        const op = this.next().value as '*' | '/'
        const right = this.parseUnary()
        left = { kind: 'binary', op, left, right }
      } else if (this.startsFactor(t)) {
        // Implicit multiplication: "9.8 m", "m_p c^2", "2(3)".
        const right = this.parseUnary()
        left = { kind: 'binary', op: '*', left, right }
      } else {
        break
      }
    }
    return left
  }

  private startsFactor(t: Token): boolean {
    return t.type === 'number' || t.type === 'ident' || t.type === 'lparen'
  }

  private parseUnary(): Node {
    const t = this.peek()
    if (t.type === 'op' && (t.value === '+' || t.value === '-')) {
      const op = this.next().value as '+' | '-'
      return { kind: 'unary', op, arg: this.parseUnary() }
    }
    return this.parsePow()
  }

  private parsePow(): Node {
    const base = this.parsePrimary()
    if (this.peek().type === 'op' && this.peek().value === '^') {
      this.next()
      const exp = this.parseUnary() // right-assoc; allows 10^-3
      return { kind: 'pow', base, exp }
    }
    return base
  }

  private parsePrimary(): Node {
    const t = this.peek()
    if (t.type === 'number') {
      this.next()
      return { kind: 'num', value: Number(t.value) }
    }
    if (t.type === 'ident') {
      this.next()
      if (FUNCTION_NAMES.has(t.value) && this.peek().type === 'lparen') {
        this.next()
        const arg = this.parseAdd()
        this.expect('rparen')
        return { kind: 'call', name: t.value, arg }
      }
      return { kind: 'ident', name: t.value }
    }
    if (t.type === 'lparen') {
      this.next()
      const inner = this.parseAdd()
      this.expect('rparen')
      return inner
    }
    throw new ParseError(`unexpected '${t.value || 'end of input'}'`)
  }
}

export function parse(input: string): Node {
  return new Parser(tokenize(input), input).parse()
}
