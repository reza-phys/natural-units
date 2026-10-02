import { Dimension } from './dimension'
import { Quantity } from './quantity'
import { toNatural } from './systems'

/** Format a number with a fixed number of significant figures, choosing plain
 *  or scientific notation, and trimming trailing zeros. */
export function fmtNum(x: number, sig = 7): string {
  if (x === 0) return '0'
  if (!Number.isFinite(x)) return x > 0 ? '∞' : x < 0 ? '−∞' : 'NaN'
  const abs = Math.abs(x)
  if (abs >= 1e6 || abs < 1e-4) {
    const [m, e] = x.toExponential(sig - 1).split('e')
    return `${trim(m)}e${Number(e)}`
  }
  return trim(x.toPrecision(sig))
}

function trim(s: string): string {
  if (!s.includes('.')) return s
  return s.replace(/\.?0+$/, '')
}

// Named SI units recognised for prettier output when the dimension matches.
const DERIVED: { symbol: string; dim: Dimension }[] = [
  { symbol: 'N', dim: Dimension.base(1, 1, -2) },
  { symbol: 'J', dim: Dimension.base(1, 2, -2) },
  { symbol: 'W', dim: Dimension.base(1, 2, -3) },
  { symbol: 'Pa', dim: Dimension.base(1, -1, -2) },
  { symbol: 'C', dim: Dimension.base(0, 0, 1, 1) },
  { symbol: 'V', dim: Dimension.base(1, 2, -3, -1) },
  { symbol: 'F', dim: Dimension.base(-1, -2, 4, 2) },
  { symbol: 'ohm', dim: Dimension.base(1, 2, -3, -2) },
  { symbol: 'T', dim: Dimension.base(1, 0, -2, -1) },
  { symbol: 'Wb', dim: Dimension.base(1, 2, -2, -1) },
  { symbol: 'H', dim: Dimension.base(1, 2, -2, -2) },
  { symbol: 'Hz', dim: Dimension.base(0, 0, -1) },
]

export interface Formatted {
  value: number
  unit: string // unit label ('' if dimensionless)
  display: string // value + unit
}

/** Display a quantity in SI: value in base units, plus a named derived unit
 *  when the dimension matches one (e.g. "1.5033e-10 J"). */
export function formatSI(q: Quantity): Formatted {
  const base = q.dim.toString()
  const num = fmtNum(q.value)
  if (q.dim.isDimensionless()) {
    return { value: q.value, unit: '', display: num }
  }
  const derived = DERIVED.find((d) => d.dim.equals(q.dim))
  const unit = derived ? derived.symbol : base
  return { value: q.value, unit, display: `${num} ${unit}` }
}

const ENERGY_PREFIXES: { p: string; f: number }[] = [
  { p: 'PeV', f: 1e15 },
  { p: 'TeV', f: 1e12 },
  { p: 'GeV', f: 1e9 },
  { p: 'MeV', f: 1e6 },
  { p: 'keV', f: 1e3 },
  { p: 'eV', f: 1 },
  { p: 'meV', f: 1e-3 },
]

/** Display a quantity in natural units (ħ = c = k_B = 1) as a power of eV. */
export function formatNatural(q: Quantity): Formatted {
  const nf = toNatural(q)
  const p = Math.round(nf.energyExp)
  const isInt = Math.abs(nf.energyExp - p) < 1e-9

  // Residual (non-energy) units: amount, luminous intensity.
  const residualPart = (
    [
      ['mol', nf.residual.mol],
      ['cd', nf.residual.cd],
    ] as const
  )
    .filter(([, v]) => Math.abs(v) > 1e-9)
    .map(([sym, v]) => (Math.abs(v - 1) < 1e-9 ? ` ${sym}` : ` ${sym}^${fmtExp(v)}`))
    .join('')

  // Pure energy (eV^1): pick a friendly prefix so the mantissa is readable.
  if (isInt && p === 1 && !residualPart && Number.isFinite(nf.coef) && nf.coef !== 0) {
    const abs = Math.abs(nf.coef)
    const pick = ENERGY_PREFIXES.find((e) => abs >= e.f) ?? ENERGY_PREFIXES[ENERGY_PREFIXES.length - 1]
    const v = nf.coef / pick.f
    return { value: v, unit: pick.p, display: `${fmtNum(v)} ${pick.p}` }
  }

  const expPart = isInt ? (p === 0 ? '' : `eV^${p}`) : `eV^${fmtExp(nf.energyExp)}`
  const unit = `${expPart}${residualPart}`.trim()
  const display = unit ? `${fmtNum(nf.coef)} ${unit}` : fmtNum(nf.coef)
  return { value: nf.coef, unit, display }
}

function fmtExp(x: number): string {
  const r = Math.round(x)
  return Math.abs(x - r) < 1e-9 ? `${r}` : x.toFixed(3)
}
