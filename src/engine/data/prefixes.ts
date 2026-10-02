// SI decimal prefixes. Symbol -> factor. Used when a token is not itself a
// whole unit/constant: we strip a leading prefix and check the remainder is a
// prefixable unit (e.g. "GeV" -> G + eV, "Mpc" -> M + pc, "ms" -> m + s).
export const PREFIXES: Record<string, number> = {
  Y: 1e24,
  Z: 1e21,
  E: 1e18,
  P: 1e15,
  T: 1e12,
  G: 1e9,
  M: 1e6,
  k: 1e3,
  h: 1e2,
  da: 1e1,
  d: 1e-1,
  c: 1e-2,
  m: 1e-3,
  u: 1e-6,
  µ: 1e-6,
  μ: 1e-6,
  n: 1e-9,
  p: 1e-12,
  f: 1e-15,
  a: 1e-18,
  z: 1e-21,
  y: 1e-24,
}

// Prefix symbols ordered longest-first so "da" is tried before "d".
export const PREFIX_SYMBOLS = Object.keys(PREFIXES).sort((a, b) => b.length - a.length)
