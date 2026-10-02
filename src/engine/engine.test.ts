import { describe, expect, it } from 'vitest'
import { calculate, type UnitSystem } from './index'

// Helper: assert a successful calculation's numeric value within a relative tolerance.
function val(input: string, system: UnitSystem = 'SI'): number {
  const r = calculate(input, system)
  if (!r.ok) throw new Error(`expected success for "${input}", got error: ${r.error}`)
  return r.value as number
}
function rel(a: number, b: number, tol = 1e-5) {
  expect(Math.abs(a - b) / Math.abs(b)).toBeLessThan(tol)
}

describe('exact / defining values', () => {
  it('speed of light is exact', () => {
    expect(val('c in m/s')).toBe(299792458)
  })
  it('eV is exactly the elementary charge in joules', () => {
    rel(val('eV in J'), 1.602176634e-19, 1e-12)
  })
  it('kg m^2 s^-2 equals one joule', () => {
    rel(val('kg m^2 s^-2 in J'), 1, 1e-12)
  })
})

describe('particle physics rest energies', () => {
  it('proton: m_p c^2 ≈ 938.272 MeV', () => {
    rel(val('m_p c^2 in MeV'), 938.27208816, 1e-6)
  })
  it('electron: m_e c^2 ≈ 510.999 keV', () => {
    rel(val('m_e c^2 in keV'), 510.99895, 1e-6)
  })
  it('neutron: m_n c^2 ≈ 939.565 MeV', () => {
    rel(val('m_n c^2 in MeV'), 939.56542, 1e-5)
  })
  it('hbar c ≈ 197.327 MeV fm', () => {
    rel(val('hbar c in MeV fm'), 197.3269804, 1e-6)
  })
})

describe('natural-unit reductions (hbar = c = k_B = 1)', () => {
  it('1 metre ≈ 5.0677e6 eV^-1', () => {
    rel(val('1 m in eV^-1', 'natural'), 5.06773e6, 1e-4)
  })
  it('1 eV corresponds to ≈ 11604.5 K', () => {
    rel(val('1 eV in K', 'natural'), 11604.518, 1e-5)
  })
  it('proton mass auto-reduces to ≈ 938.272 MeV', () => {
    const r = calculate('m_p', 'natural')
    expect(r.ok).toBe(true)
    rel(r.value as number, 938.272, 1e-4)
    expect(r.unit).toBe('MeV')
  })
  it('Compton-ish: 1/(100 GeV) ≈ 1.9733e-3 fm', () => {
    rel(val('1/(100 GeV) in fm', 'natural'), 1.97327e-3, 1e-4)
  })
  it('room temperature k*300 K ≈ 0.025852 eV', () => {
    rel(val('k*300 K in eV'), 0.0258520, 1e-4)
  })
  it('magnetic field reduces to eV^2: 1 T ≈ 195.35 eV^2', () => {
    rel(val('1 T in eV^2', 'natural'), 195.35, 3e-3)
  })
  it('elementary charge is dimensionless: qe^2/(4 pi) ≈ 1/137 (fine structure)', () => {
    rel(val('qe^2/(4 pi)', 'natural'), 1 / 137.035999, 2e-3)
  })
})

describe('prefix and symbol resolution', () => {
  it('GeV = 1e9 eV', () => rel(val('GeV in eV'), 1e9, 1e-12))
  it('Mpc = 1e6 pc', () => rel(val('Mpc in pc'), 1e6, 1e-12))
  it('ms = 1e-3 s', () => rel(val('ms in s'), 1e-3, 1e-12))
  it('min = 60 s (whole-unit beats prefix)', () => rel(val('min in s'), 60, 1e-12))
  it('km = 1000 m', () => rel(val('km in m'), 1000, 1e-12))
  it('G is Newton constant, not a prefix', () => {
    rel(val('G'), 6.6743e-11, 1e-9)
  })
})

describe('functions and arithmetic', () => {
  it('sin(pi/6) = 0.5', () => rel(val('sin(pi/6)'), 0.5, 1e-9))
  it('sqrt of a barn is 10 fm', () => rel(val('sqrt(b) in fm'), 10, 1e-9))
  it('implicit multiplication: 9.8 m/s^2 has accel dimension', () => {
    const r = calculate('9.8 m/s^2', 'SI')
    expect(r.ok).toBe(true)
    expect(r.dimension).toBe('m/s^2')
  })
})

describe('error handling', () => {
  it('rejects adding incompatible dimensions', () => {
    expect(calculate('1 m + 1 s', 'SI').ok).toBe(false)
  })
  it('rejects dimensionful function argument', () => {
    expect(calculate('sin(1 m)', 'SI').ok).toBe(false)
  })
  it('rejects incompatible conversion', () => {
    expect(calculate('1 m in s', 'SI').ok).toBe(false)
  })
  it('reports unknown symbols', () => {
    const r = calculate('1 foobar', 'SI')
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/unknown symbol/)
  })
  it('empty input is flagged, not an error', () => {
    expect(calculate('   ', 'SI').empty).toBe(true)
  })
})
