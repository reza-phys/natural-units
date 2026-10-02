import { Dimension } from './dimension'
import { Rational } from './fraction'

// A physical quantity: a numeric value expressed in SI base units, paired with
// its dimension. All arithmetic keeps the value in SI; unit systems only affect
// how the final result is reduced and displayed.
export class Quantity {
  readonly value: number
  readonly dim: Dimension

  constructor(value: number, dim: Dimension) {
    this.value = value
    this.dim = dim
  }

  static dimensionless(value: number): Quantity {
    return new Quantity(value, Dimension.DIMENSIONLESS)
  }

  mul(o: Quantity): Quantity {
    return new Quantity(this.value * o.value, this.dim.add(o.dim))
  }
  div(o: Quantity): Quantity {
    return new Quantity(this.value / o.value, this.dim.sub(o.dim))
  }

  add(o: Quantity): Quantity {
    if (!this.dim.equals(o.dim)) {
      throw new EvalDimError(
        `cannot add quantities with different dimensions: [${this.dim.toString() || 'dimensionless'}] + [${o.dim.toString() || 'dimensionless'}]`,
      )
    }
    return new Quantity(this.value + o.value, this.dim)
  }
  sub(o: Quantity): Quantity {
    if (!this.dim.equals(o.dim)) {
      throw new EvalDimError(
        `cannot subtract quantities with different dimensions: [${this.dim.toString() || 'dimensionless'}] - [${o.dim.toString() || 'dimensionless'}]`,
      )
    }
    return new Quantity(this.value - o.value, this.dim)
  }
  neg(): Quantity {
    return new Quantity(-this.value, this.dim)
  }

  /** Raise to a power. Dimensionless bases accept any real exponent; dimensionful
   *  bases require a rational exponent so the resulting dimension is well-defined. */
  pow(exp: Quantity): Quantity {
    if (!exp.dim.isDimensionless()) {
      throw new EvalDimError('exponent must be dimensionless')
    }
    const p = exp.value
    if (this.dim.isDimensionless()) {
      return Quantity.dimensionless(Math.pow(this.value, p))
    }
    const r = Rational.fromNumber(p)
    if (Math.abs(r.toNumber() - p) > 1e-9) {
      throw new EvalDimError('cannot raise a dimensionful quantity to an irrational power')
    }
    return new Quantity(Math.pow(this.value, p), this.dim.scale(r))
  }
}

// Distinct error type so the UI can present dimension problems clearly.
export class EvalDimError extends Error {}
