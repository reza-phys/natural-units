import { CONSTANTS } from './data/constants'
import type { Entity } from './data/entityTypes'
import { PARTICLES } from './data/particles'
import { formatSI } from './format'
import { Quantity } from './quantity'

export type { Entity, Property, EntityKind } from './data/entityTypes'

// Build constant entities from the constants table (deduping symbols that share
// a name, e.g. k and k_B), so the same data + citations power the lookup box.
// Constants already represented as particles (m_p etc.) — skip to avoid dupes.
const PARTICLE_CONSTS = new Set(['m_e', 'm_p', 'm_n', 'm_W', 'm_Z'])

function buildConstantEntities(): Entity[] {
  const byName = new Map<string, Entity>()
  for (const c of CONSTANTS) {
    if (PARTICLE_CONSTS.has(c.symbol)) continue
    const f = formatSI(new Quantity(c.value, c.dim))
    const existing = byName.get(c.name)
    if (existing) {
      existing.aliases.push(c.symbol)
      continue
    }
    byName.set(c.name, {
      id: `const:${c.symbol}`,
      kind: 'constant',
      name: c.name,
      symbol: c.symbol,
      calcSymbol: c.symbol,
      calcValue: f.display,
      aliases: [c.symbol, c.name],
      properties: [
        {
          label: 'Value (SI)',
          display: f.display,
          numeric: f.value,
          unit: f.unit,
          source: c.source,
        },
      ],
    })
  }
  return [...byName.values()]
}

const ENTITIES: Entity[] = [...PARTICLES, ...buildConstantEntities()]

// --- Fuzzy matching ----------------------------------------------------------
const STOP = new Set([
  'the', 'a', 'an', 'of', 'particle', 'boson', 'lepton', 'quark', 'meson', 'baryon',
  'constant', 'mass',
])

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}
function tokens(s: string): string[] {
  return norm(s).split(' ').filter((t) => t && !STOP.has(t))
}

/** Levenshtein edit distance. */
function lev(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (!m) return n
  if (!n) return m
  let prev = Array.from({ length: n + 1 }, (_, i) => i)
  let cur = new Array<number>(n + 1)
  for (let i = 1; i <= m; i++) {
    cur[0] = i
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
    }
    ;[prev, cur] = [cur, prev]
  }
  return prev[n]
}

function scoreStr(query: string, target: string): number {
  const nq = norm(query)
  const nt = norm(target)
  if (!nq || !nt) return 0
  if (nq === nt) return 1000
  if (nt.startsWith(nq)) return 850
  if (nt.includes(nq)) return 700
  // Target contained in query — guard against 1–2 char aliases ("p", "e") that
  // would otherwise match almost any longer query.
  if (nt.length >= 3 && nq.includes(nt)) return 650

  const qt = tokens(query)
  const tt = tokens(target)
  let tokenScore = 0
  if (qt.length && tt.length) {
    let hits = 0
    for (const a of qt) {
      for (const b of tt) {
        if (a === b) {
          hits += 1
          break
        }
        if (b.startsWith(a) || a.startsWith(b)) {
          hits += 0.8
          break
        }
        const d = lev(a, b)
        if (Math.max(a.length, b.length) > 0 && d / Math.max(a.length, b.length) <= 0.34) {
          hits += 0.6
          break
        }
      }
    }
    tokenScore = (hits / qt.length) * 600
  }

  const d = lev(nq, nt)
  const m = Math.max(nq.length, nt.length)
  const fuzzy = m > 0 ? Math.max(0, 1 - d / m) * 520 : 0

  return Math.max(tokenScore, fuzzy)
}

function scoreEntity(query: string, e: Entity): number {
  let best = 0
  for (const t of [e.name, ...e.aliases, e.symbol ?? '', e.calcSymbol ?? '']) {
    if (t) best = Math.max(best, scoreStr(query, t))
  }
  return best
}

export interface SearchHit {
  entity: Entity
  score: number
}

/** Rank entities by fuzzy relevance to the query (best first). */
export function searchEntities(query: string, limit = 6): SearchHit[] {
  const q = query.trim()
  if (!q) return []
  return ENTITIES.map((entity) => ({ entity, score: scoreEntity(q, entity) }))
    .filter((r) => r.score >= 320)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
