import { Rational, R } from './fraction'

// Physical dimension as a vector of rational exponents over the seven SI base
// dimensions. Order is fixed:
//   [Mass, Length, Time, Current, Temperature, Amount, Luminous intensity].
export const BASE_DIMS = ['M', 'L', 'T', 'I', 'Θ', 'N', 'J'] as const
export const BASE_UNIT_SYMBOLS = ['kg', 'm', 's', 'A', 'K', 'mol', 'cd'] as const
export type BaseIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6
const N = 7

export class Dimension {
  readonly e: readonly Rational[] // length N

  constructor(e: readonly Rational[]) {
    if (e.length !== N) throw new Error('Dimension: wrong length')
    this.e = e
  }

  static readonly DIMENSIONLESS = new Dimension([
    Rational.ZERO,
    Rational.ZERO,
    Rational.ZERO,
    Rational.ZERO,
    Rational.ZERO,
    Rational.ZERO,
    Rational.ZERO,
  ])

  /** Build from integer exponents, e.g. base(1, 2, -2) for energy (M L^2 T^-2).
   *  Trailing args: I (current), Th (temperature), N (amount), J (luminous). */
  static base(M = 0, L = 0, T = 0, I = 0, Th = 0, Namt = 0, Jlum = 0): Dimension {
    return new Dimension([R(M), R(L), R(T), R(I), R(Th), R(Namt), R(Jlum)])
  }

  add(o: Dimension): Dimension {
    return new Dimension(this.e.map((x, i) => x.add(o.e[i])))
  }
  sub(o: Dimension): Dimension {
    return new Dimension(this.e.map((x, i) => x.sub(o.e[i])))
  }
  scale(r: Rational): Dimension {
    return new Dimension(this.e.map((x) => x.mul(r)))
  }
  equals(o: Dimension): boolean {
    return this.e.every((x, i) => x.equals(o.e[i]))
  }
  isDimensionless(): boolean {
    return this.e.every((x) => x.isZero())
  }

  /** Human-readable form, e.g. "kg m^2 s^-2" (empty string if dimensionless). */
  toString(): string {
    const num: string[] = []
    const den: string[] = []
    this.e.forEach((x, i) => {
      if (x.isZero()) return
      const sym = BASE_UNIT_SYMBOLS[i]
      const a = x.toNumber()
      if (a > 0) num.push(a === 1 ? sym : `${sym}^${x.toString()}`)
      else den.push(a === -1 ? sym : `${sym}^${x.neg().toString()}`)
    })
    if (num.length === 0 && den.length === 0) return ''
    const top = num.length ? num.join(' ') : '1'
    return den.length ? `${top}/${den.join(' ')}` : top
  }
}
