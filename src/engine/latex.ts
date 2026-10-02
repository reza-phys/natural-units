import type { Node } from './ast'
import { parse } from './parser'

// Render the *parsed* expression as LaTeX, so the user can see exactly how the
// calculator groups things (precedence, implicit multiplication, division).
// e.g. "T/10 eV^2" -> \frac{T}{10}\cdot\mathrm{eV}^{2}, making it clear that
// eV^2 multiplies the fraction rather than sitting in the denominator.

interface Rendered {
  tex: string
  prec: number // 0 convert, 1 +/-, 2 * /, 3 unary, 4 pow, 5 atom
}

const FUNC_TEX: Record<string, string> = {
  sin: '\\sin', cos: '\\cos', tan: '\\tan',
  asin: '\\arcsin', acos: '\\arccos', atan: '\\arctan',
  arcsin: '\\arcsin', arccos: '\\arccos', arctan: '\\arctan',
  sinh: '\\sinh', cosh: '\\cosh', tanh: '\\tanh',
  ln: '\\ln', log: '\\log', exp: '\\exp',
}

// Multi-letter symbols that should render as a proper glyph, not upright text.
const SPECIAL: Record<string, string> = {
  pi: '\\pi',
  hbar: '\\hbar',
  mu0: '\\mu_0',
  eps0: '\\varepsilon_0',
  sigma: '\\sigma',
}

function baseTex(s: string): string {
  return SPECIAL[s] ?? (s.length > 1 ? `\\mathrm{${s}}` : s)
}

function identTex(name: string): string {
  if (SPECIAL[name]) return SPECIAL[name]
  const i = name.indexOf('_')
  if (i >= 0) {
    const b = name.slice(0, i)
    const sub = name.slice(i + 1)
    return `${baseTex(b)}_{${sub.length > 1 ? `\\mathrm{${sub}}` : sub}}`
  }
  return baseTex(name)
}

function numTex(v: number): string {
  if (Number.isInteger(v)) return String(v)
  const s = String(v)
  if (s.includes('e')) {
    const [m, e] = s.split('e')
    return `${m}\\times10^{${Number(e)}}`
  }
  return s
}

function wrap(r: Rendered, min: number): string {
  return r.prec < min ? `\\left(${r.tex}\\right)` : r.tex
}

function rec(n: Node): Rendered {
  switch (n.kind) {
    case 'num':
      return { tex: numTex(n.value), prec: 5 }
    case 'ident':
      return { tex: identTex(n.name), prec: 5 }
    case 'unary':
      return { tex: `${n.op}${wrap(rec(n.arg), 3)}`, prec: 3 }
    case 'pow':
      return { tex: `${wrap(rec(n.base), 4)}^{${rec(n.exp).tex}}`, prec: 4 }
    case 'binary': {
      if (n.op === '/') {
        return { tex: `\\frac{${rec(n.left).tex}}{${rec(n.right).tex}}`, prec: 2 }
      }
      if (n.op === '*') {
        return { tex: `${wrap(rec(n.left), 2)}\\cdot ${wrap(rec(n.right), 2)}`, prec: 2 }
      }
      const l = wrap(rec(n.left), 1)
      const r = wrap(rec(n.right), n.op === '-' ? 2 : 1)
      return { tex: `${l} ${n.op} ${r}`, prec: 1 }
    }
    case 'call':
      if (n.name === 'sqrt') return { tex: `\\sqrt{${rec(n.arg).tex}}`, prec: 5 }
      if (n.name === 'abs') return { tex: `\\left|${rec(n.arg).tex}\\right|`, prec: 5 }
      return {
        tex: `${FUNC_TEX[n.name] ?? `\\operatorname{${n.name}}`}\\!\\left(${rec(n.arg).tex}\\right)`,
        prec: 5,
      }
    case 'convert':
      return {
        tex: `${rec(n.expr).tex}\\;\\rightarrow\\;${rec(n.target).tex}`,
        prec: 0,
      }
  }
}

/** LaTeX for the parsed input, or null if it cannot be parsed. */
export function exprToLatex(input: string): string | null {
  const t = input.trim()
  if (!t) return null
  try {
    return rec(parse(t)).tex
  } catch {
    return null
  }
}
