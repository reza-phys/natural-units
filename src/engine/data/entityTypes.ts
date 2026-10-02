import type { Source } from './constants'

// A single attribute of an entity (mass, charge, spin, value, …).
export interface Property {
  label: string
  display: string // human-readable value, e.g. "938.272 MeV" or "+1 e" or "1/2"
  numeric?: number // value for precision/LaTeX copy (in the unit below)
  unit?: string // unit label for copy, e.g. "MeV", "kg", "C"
  source?: Source // clickable, checkable citation for this property
}

export type EntityKind = 'particle' | 'constant'

// A looked-up thing: a particle, constant, etc.
export interface Entity {
  id: string
  kind: EntityKind
  name: string // canonical name, e.g. "Proton"
  symbol?: string // display symbol, e.g. "p", "γ", "W±"
  calcSymbol?: string // built-in calculator symbol, e.g. "m_p" (so users know what to type)
  calcValue?: string // the calculator symbol's value, e.g. "1.672622e-27 kg"
  aliases: string[] // alternative names/spellings for fuzzy search
  summary?: string // one-line description
  properties: Property[]
}
