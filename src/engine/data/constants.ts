import { Dimension } from '../dimension'

export interface Source {
  label: string // short citation shown to the user
  url: string // clickable, directly checkable link to the source value
}

export interface ConstantDef {
  symbol: string
  value: number // SI value
  dim: Dimension
  name: string
  source: Source
}

// --- Citation helpers --------------------------------------------------------
// NIST's CODATA value pages: one stable, directly-checkable URL per constant.
const nist = (key: string): Source => ({
  label: 'CODATA 2022 · NIST',
  url: `https://physics.nist.gov/cgi-bin/cuu/Value?${key}`,
})
const pdg = (node: string): Source => ({
  label: 'PDG 2026',
  url: `https://pdglive.lbl.gov/Particle.action?node=${node}`,
})
const SUN: Source = {
  label: 'NASA Sun Fact Sheet',
  url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html',
}
const EARTH: Source = {
  label: 'NASA Earth Fact Sheet',
  url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html',
}
const PLANCK: Source = {
  label: 'Planck 2018 · arXiv:1807.06209',
  url: 'https://arxiv.org/abs/1807.06209',
}

// --- Defining constants (SI 2019, exact) ---
const c = 299792458 // m/s
const h = 6.62607015e-34 // J s
const hbar = 1.054571817e-34 // J s  (h / 2pi)
const qe = 1.602176634e-19 // C  (1 eV in joules)
const kB = 1.380649e-23 // J/K
const NA = 6.02214076e23 // 1/mol

// Distances used to derive a few constants below.
const MPC_IN_M = 3.0856775814913673e22 // parsec * 1e6
const YR_IN_S = 31557600 // Julian year (365.25 days)

// A GeV expressed as a mass in kg, for particle masses quoted as energies.
const gevMass = (gev: number) => (gev * 1e9 * qe) / (c * c)

export const CONSTANTS: ConstantDef[] = [
  {
    symbol: 'pi',
    value: Math.PI,
    dim: Dimension.DIMENSIONLESS,
    name: 'pi',
    source: { label: 'OEIS A000796', url: 'https://oeis.org/A000796' },
  },
  {
    symbol: 'e',
    value: Math.E,
    dim: Dimension.DIMENSIONLESS,
    name: "Euler's number",
    source: { label: 'OEIS A001113', url: 'https://oeis.org/A001113' },
  },

  { symbol: 'c', value: c, dim: Dimension.base(0, 1, -1), name: 'speed of light', source: nist('c') },
  { symbol: 'h', value: h, dim: Dimension.base(1, 2, -1), name: 'Planck constant', source: nist('h') },
  {
    symbol: 'hbar',
    value: hbar,
    dim: Dimension.base(1, 2, -1),
    name: 'reduced Planck constant',
    source: nist('hbar'),
  },
  { symbol: 'k', value: kB, dim: Dimension.base(1, 2, -2, 0, -1), name: 'Boltzmann constant', source: nist('k') },
  { symbol: 'k_B', value: kB, dim: Dimension.base(1, 2, -2, 0, -1), name: 'Boltzmann constant', source: nist('k') },
  { symbol: 'N_A', value: NA, dim: Dimension.base(0, 0, 0, 0, 0, -1), name: 'Avogadro constant', source: nist('na') },
  { symbol: 'R', value: 8.31446261815324, dim: Dimension.base(1, 2, -2, 0, -1, -1), name: 'molar gas constant', source: nist('r') },
  { symbol: 'G', value: 6.6743e-11, dim: Dimension.base(-1, 3, -2), name: 'gravitational constant', source: nist('bg') },
  {
    symbol: 'sigma',
    value: 5.670374419e-8,
    dim: Dimension.base(1, 0, -3, 0, -4),
    name: 'Stefan-Boltzmann constant',
    source: nist('sigma'),
  },
  { symbol: 'qe', value: qe, dim: Dimension.base(0, 0, 1, 1), name: 'elementary charge', source: nist('e') },
  {
    symbol: 'eps0',
    value: 8.8541878188e-12,
    dim: Dimension.base(-1, -3, 4, 2),
    name: 'vacuum electric permittivity',
    source: nist('ep0'),
  },
  {
    symbol: 'mu0',
    value: 1.25663706127e-6,
    dim: Dimension.base(1, 1, -2, -2),
    name: 'vacuum magnetic permeability',
    source: nist('mu0'),
  },

  // Particle / atomic masses (kg), CODATA 2022 except W/Z (PDG).
  { symbol: 'm_e', value: 9.1093837139e-31, dim: Dimension.base(1), name: 'electron mass', source: nist('me') },
  { symbol: 'm_p', value: 1.67262192595e-27, dim: Dimension.base(1), name: 'proton mass', source: nist('mp') },
  { symbol: 'm_n', value: 1.67492750056e-27, dim: Dimension.base(1), name: 'neutron mass', source: nist('mn') },
  { symbol: 'm_W', value: gevMass(80.3625), dim: Dimension.base(1), name: 'W boson mass (80.3625 GeV)', source: pdg('S043') },
  { symbol: 'm_Z', value: gevMass(91.1879), dim: Dimension.base(1), name: 'Z boson mass (91.1879 GeV)', source: pdg('S044') },
  { symbol: 'm_pl', value: 2.176434e-8, dim: Dimension.base(1), name: 'Planck mass', source: nist('plkm') },

  // Astrophysical.
  { symbol: 'M_Sun', value: 1.9885e30, dim: Dimension.base(1), name: 'solar mass', source: SUN },
  { symbol: 'R_Sun', value: 6.957e8, dim: Dimension.base(0, 1), name: 'solar radius', source: SUN },
  { symbol: 'M_Earth', value: 5.9722e24, dim: Dimension.base(1), name: 'Earth mass', source: EARTH },
  { symbol: 'R_Earth', value: 6.371e6, dim: Dimension.base(0, 1), name: 'Earth mean radius', source: EARTH },
  {
    symbol: 'H0',
    value: (67.4 * 1000) / MPC_IN_M,
    dim: Dimension.base(0, 0, -1),
    name: 'Hubble constant (67.4 km/s/Mpc)',
    source: PLANCK,
  },
]

export { YR_IN_S, MPC_IN_M }
