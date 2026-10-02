import { Quantity } from './quantity'

export type UnitSystem = 'SI' | 'natural' | 'gaussian'

export const UNIT_SYSTEMS: { id: UnitSystem; label: string; hint: string }[] = [
  { id: 'SI', label: 'SI', hint: 'metres, kilograms, seconds' },
  { id: 'natural', label: 'Natural', hint: 'ħ = c = kʙ = 1, energy in eV' },
  { id: 'gaussian', label: 'Gaussian', hint: 'CGS-Gaussian, c = 1 (experimental)' },
]

// --- Natural-unit conversion factors, derived from the SI constants so there
//     is a single source of truth (ħ = c = k_B = 1). ---
const C = 299792458
const HBAR = 1.054571817e-34
const QE = 1.602176634e-19
const KB = 1.380649e-23
const EPS0 = 8.8541878188e-12

const KG_TO_EV = (C * C) / QE //  1 kg -> eV          (energy exponent +1)
const M_TO_INV_EV = QE / (HBAR * C) //  1 m  -> eV^-1   (energy exponent -1)
const S_TO_INV_EV = QE / HBAR //  1 s  -> eV^-1        (energy exponent -1)
const K_TO_EV = KB / QE //  1 K  -> eV               (energy exponent +1)
// Heaviside–Lorentz electromagnetism (ε0 = ħ = c = 1): charge is dimensionless,
// so the ampere reduces to energy. 1 A -> eV (energy exponent +1). This makes
// e.g. a magnetic field carry dimension eV^2 (1 T ≈ 195 eV^2).
const A_TO_EV = HBAR / QE / Math.sqrt(EPS0 * HBAR * C)

export interface NaturalForm {
  coef: number // numeric value when written as coef * eV^energyExp * (residual units)
  energyExp: number // power of energy (eV)
  // Dimensions that do not reduce to energy (amount, luminous intensity).
  residual: { mol: number; cd: number }
}

/** Reduce an SI quantity to natural units (ħ = c = k_B = ε0 = 1). */
export function toNatural(q: Quantity): NaturalForm {
  const e = q.dim.e.map((r) => r.toNumber())
  const [eM, eL, eT, eI, eTh, eMol, eCd] = e
  const coef =
    q.value *
    Math.pow(KG_TO_EV, eM) *
    Math.pow(M_TO_INV_EV, eL) *
    Math.pow(S_TO_INV_EV, eT) *
    Math.pow(K_TO_EV, eTh) *
    Math.pow(A_TO_EV, eI)
  return {
    coef,
    energyExp: eM - eL - eT + eTh + eI,
    residual: { mol: eMol, cd: eCd },
  }
}

const EPS = 1e-9
const close = (a: number, b: number) => Math.abs(a - b) < EPS

export interface Conversion {
  ratio: number // how many `target` units the source equals
  ok: boolean
  reason?: string
}

/** Convert `source` into multiples of `target` within the given unit system. */
export function convert(source: Quantity, target: Quantity, system: UnitSystem): Conversion {
  if (system === 'natural') {
    const a = toNatural(source)
    const b = toNatural(target)
    const residualOk =
      close(a.residual.mol, b.residual.mol) && close(a.residual.cd, b.residual.cd)
    if (!close(a.energyExp, b.energyExp) || !residualOk) {
      return {
        ratio: NaN,
        ok: false,
        reason: `incompatible in natural units: energy dimension eV^${fmtExp(a.energyExp)} vs eV^${fmtExp(b.energyExp)}`,
      }
    }
    return { ratio: a.coef / b.coef, ok: true }
  }

  // SI and Gaussian: require identical SI dimensions.
  if (!source.dim.equals(target.dim)) {
    return {
      ratio: NaN,
      ok: false,
      reason: `incompatible dimensions: [${source.dim.toString() || 'dimensionless'}] vs [${target.dim.toString() || 'dimensionless'}]`,
    }
  }
  return { ratio: source.value / target.value, ok: true }
}

function fmtExp(x: number): string {
  const r = Math.round(x)
  return close(x, r) ? `${r}` : x.toFixed(3)
}
