// Minimal exact rational number, used for dimension exponents so that
// operations like sqrt(barn) -> length keep exact half-integer exponents
// (no floating-point epsilon bugs when comparing dimensions).

function gcd(a: number, b: number): number {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b) {
    ;[a, b] = [b, a % b]
  }
  return a || 1
}

export class Rational {
  readonly n: number // numerator (carries sign)
  readonly d: number // denominator (always > 0)

  constructor(n: number, d = 1) {
    if (d === 0) throw new Error('Rational: zero denominator')
    if (!Number.isInteger(n) || !Number.isInteger(d)) {
      throw new Error('Rational: non-integer components')
    }
    if (d < 0) {
      n = -n
      d = -d
    }
    const g = gcd(n, d)
    this.n = n / g
    this.d = d / g
  }

  static readonly ZERO = new Rational(0)
  static readonly ONE = new Rational(1)

  /** Approximate a real number by a rational with a bounded denominator. */
  static fromNumber(x: number, maxDen = 1000): Rational {
    if (Number.isInteger(x)) return new Rational(x)
    if (!Number.isFinite(x)) throw new Error('Rational.fromNumber: non-finite')
    // Continued-fraction approximation.
    let h0 = 0,
      h1 = 1,
      k0 = 1,
      k1 = 0
    let b = x
    const sign = x < 0 ? -1 : 1
    b = Math.abs(b)
    for (let i = 0; i < 40; i++) {
      const a = Math.floor(b)
      const h2 = a * h1 + h0
      const k2 = a * k1 + k0
      if (k2 > maxDen) break
      h0 = h1
      h1 = h2
      k0 = k1
      k1 = k2
      const frac = b - a
      if (frac < 1e-12) break
      b = 1 / frac
    }
    return new Rational(sign * h1, k1)
  }

  add(o: Rational): Rational {
    return new Rational(this.n * o.d + o.n * this.d, this.d * o.d)
  }
  sub(o: Rational): Rational {
    return new Rational(this.n * o.d - o.n * this.d, this.d * o.d)
  }
  mul(o: Rational): Rational {
    return new Rational(this.n * o.n, this.d * o.d)
  }
  neg(): Rational {
    return new Rational(-this.n, this.d)
  }
  isZero(): boolean {
    return this.n === 0
  }
  equals(o: Rational): boolean {
    return this.n === o.n && this.d === o.d
  }
  toNumber(): number {
    return this.n / this.d
  }
  toString(): string {
    return this.d === 1 ? `${this.n}` : `${this.n}/${this.d}`
  }
}

export const R = (n: number, d = 1) => new Rational(n, d)
