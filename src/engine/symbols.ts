import { CONSTANTS, type ConstantDef } from './data/constants'
import { PREFIXES, PREFIX_SYMBOLS } from './data/prefixes'
import { UNITS, type UnitDef } from './data/units'
import { Quantity } from './quantity'

const CONST_MAP = new Map(CONSTANTS.map((c) => [c.symbol, c]))
const UNIT_MAP = new Map(UNITS.map((un) => [un.symbol, un]))

export interface ResolvedSymbol {
  quantity: Quantity
  kind: 'constant' | 'unit'
}

/**
 * Resolve an identifier to a quantity, trying in order:
 *   1. a physical constant (whole token)   -> e.g. c, hbar, m_p, G
 *   2. a unit (whole token)                -> e.g. eV, min, pc
 *   3. an SI prefix + prefixable unit       -> e.g. GeV, Mpc, ms, km
 * Whole-token matches win first, so `min` is a minute (not milli-inch) and
 * `G` is Newton's constant (not the giga prefix on nothing).
 */
export function resolveSymbol(name: string): ResolvedSymbol | null {
  const c = CONST_MAP.get(name)
  if (c) return { quantity: new Quantity(c.value, c.dim), kind: 'constant' }

  const un = UNIT_MAP.get(name)
  if (un) return { quantity: new Quantity(un.value, un.dim), kind: 'unit' }

  for (const p of PREFIX_SYMBOLS) {
    if (name.length > p.length && name.startsWith(p)) {
      const rest = UNIT_MAP.get(name.slice(p.length))
      if (rest && rest.prefixable) {
        return {
          quantity: new Quantity(PREFIXES[p] * rest.value, rest.dim),
          kind: 'unit',
        }
      }
    }
  }
  return null
}

export function lookupUnit(name: string): UnitDef | undefined {
  return UNIT_MAP.get(name)
}

export type SymbolInfo =
  | { kind: 'constant'; def: ConstantDef }
  | { kind: 'unit'; def: UnitDef; prefix?: string }

/** Describe an identifier (for citations): which constant or unit it refers to. */
export function describeSymbol(name: string): SymbolInfo | null {
  const c = CONST_MAP.get(name)
  if (c) return { kind: 'constant', def: c }

  const un = UNIT_MAP.get(name)
  if (un) return { kind: 'unit', def: un }

  for (const p of PREFIX_SYMBOLS) {
    if (name.length > p.length && name.startsWith(p)) {
      const rest = UNIT_MAP.get(name.slice(p.length))
      if (rest && rest.prefixable) return { kind: 'unit', def: rest, prefix: p }
    }
  }
  return null
}
