import type { Node } from './ast'
import { Dimension } from './dimension'
import { evaluate } from './evaluate'
import { fmtNum, formatNatural, formatSI } from './format'
import { parse } from './parser'
import { Quantity } from './quantity'
import { describeSymbol } from './symbols'
import { convert, toNatural, type NaturalForm, type UnitSystem } from './systems'
import type { Source } from './data/constants'

/** SI value + unit label for a constant/unit definition, e.g. "1.602177e-19 C". */
export function siLabel(d: { value: number; dim: Dimension }): string {
  return formatSI(new Quantity(d.value, d.dim)).display
}

export type { UnitSystem } from './systems'
export type { Source, ConstantDef } from './data/constants'
export type { UnitDef } from './data/units'
export type { Entity, Property, EntityKind } from './data/entityTypes'
export type { SearchHit } from './lookup'
export { UNIT_SYSTEMS } from './systems'
export { CONSTANTS } from './data/constants'
export { UNITS } from './data/units'
export { fmtNum } from './format'
export { searchEntities } from './lookup'
export { exprToLatex } from './latex'

export interface CalcResult {
  ok: boolean
  empty?: boolean
  /** Full "value unit" string ready to display. */
  display?: string
  value?: number
  unit?: string
  /** SI dimension string, e.g. "kg m^2 s^-2" (for the info line). */
  dimension?: string
  /** True when the input used `in` / `to` / `->`. */
  isConversion?: boolean
  natural?: NaturalForm
  error?: string
}

/** Parse, evaluate, and format an expression in the chosen unit system. */
export function calculate(input: string, system: UnitSystem): CalcResult {
  const trimmed = input.trim()
  if (!trimmed) return { ok: false, empty: true }

  try {
    const node = parse(trimmed)

    if (node.kind === 'convert') {
      const expr = evaluate(node.expr)
      const target = evaluate(node.target)
      const conv = convert(expr, target, system)
      if (!conv.ok) return { ok: false, error: conv.reason }
      return {
        ok: true,
        isConversion: true,
        value: conv.ratio,
        unit: node.targetText,
        display: `${fmtNum(conv.ratio)} ${node.targetText}`,
        dimension: expr.dim.toString(),
      }
    }

    const q = evaluate(node)
    const f = system === 'natural' ? formatNatural(q) : formatSI(q)
    return {
      ok: true,
      value: f.value,
      unit: f.unit,
      display: f.display,
      dimension: q.dim.toString(),
      natural: system === 'natural' ? toNatural(q) : undefined,
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export interface UsedSymbol {
  symbol: string
  name: string
  siValue: string // the value in SI, e.g. "1.602177e-19 C" — checkable against the source
  source: Source
}

export interface UsedSymbols {
  constants: UsedSymbol[]
  units: UsedSymbol[]
}

function collectIdents(node: Node, out: Set<string>): void {
  switch (node.kind) {
    case 'ident':
      out.add(node.name)
      break
    case 'unary':
      collectIdents(node.arg, out)
      break
    case 'binary':
      collectIdents(node.left, out)
      collectIdents(node.right, out)
      break
    case 'pow':
      collectIdents(node.base, out)
      collectIdents(node.exp, out)
      break
    case 'call':
      collectIdents(node.arg, out)
      break
    case 'convert':
      collectIdents(node.expr, out)
      collectIdents(node.target, out)
      break
  }
}

/** List the cited constants and units referenced by an expression, with their
 *  SI values and source links — so every parameter value is traceable. */
export function symbolsUsed(input: string): UsedSymbols {
  const trimmed = input.trim()
  if (!trimmed) return { constants: [], units: [] }
  let node: Node
  try {
    node = parse(trimmed)
  } catch {
    return { constants: [], units: [] }
  }

  const names = new Set<string>()
  collectIdents(node, names)

  const constants: UsedSymbol[] = []
  const units: UsedSymbol[] = []
  const seen = new Set<string>()

  for (const name of names) {
    const info = describeSymbol(name)
    if (!info) continue
    const key = `${info.kind}:${info.def.symbol}`
    if (seen.has(key)) continue
    seen.add(key)
    const item: UsedSymbol = {
      symbol: info.def.symbol,
      name: info.def.name,
      siValue: formatSI(new Quantity(info.def.value, info.def.dim)).display,
      source: info.def.source,
    }
    if (info.kind === 'constant') constants.push(item)
    else units.push(item)
  }
  return { constants, units }
}
