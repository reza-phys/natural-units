import type { Node } from './ast'
import { FUNCTIONS } from './functions'
import { EvalDimError, Quantity } from './quantity'
import { resolveSymbol } from './symbols'

export class EvalError extends Error {}

/** Evaluate an AST node (excluding a top-level `convert`) to an SI quantity. */
export function evaluate(node: Node): Quantity {
  switch (node.kind) {
    case 'num':
      return Quantity.dimensionless(node.value)

    case 'ident': {
      const r = resolveSymbol(node.name)
      if (!r) throw new EvalError(`unknown symbol '${node.name}'`)
      return r.quantity
    }

    case 'unary': {
      const v = evaluate(node.arg)
      return node.op === '-' ? v.neg() : v
    }

    case 'binary': {
      const l = evaluate(node.left)
      const r = evaluate(node.right)
      switch (node.op) {
        case '+':
          return l.add(r)
        case '-':
          return l.sub(r)
        case '*':
          return l.mul(r)
        case '/':
          return l.div(r)
      }
      break
    }

    case 'pow': {
      const base = evaluate(node.base)
      const exp = evaluate(node.exp)
      return base.pow(exp)
    }

    case 'call': {
      const arg = evaluate(node.arg)
      // Dimension-aware functions: sqrt halves the dimension, abs preserves it.
      if (node.name === 'sqrt') return arg.pow(Quantity.dimensionless(0.5))
      if (node.name === 'abs') return new Quantity(Math.abs(arg.value), arg.dim)

      const fn = FUNCTIONS[node.name]
      if (!fn) throw new EvalError(`unknown function '${node.name}'`)
      if (!arg.dim.isDimensionless()) {
        throw new EvalDimError(`${node.name}() requires a dimensionless argument`)
      }
      return Quantity.dimensionless(fn(arg.value))
    }

    case 'convert':
      throw new EvalError('unexpected conversion (in/to) here')
  }
  // Unreachable, but satisfies the type checker.
  throw new EvalError('could not evaluate expression')
}
