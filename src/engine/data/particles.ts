import type { Source } from './constants'
import type { Entity, Property } from './entityTypes'

// Citation helpers.
const pdg = (node: string): Source => ({
  label: 'PDG 2026',
  url: `https://pdglive.lbl.gov/Particle.action?node=${node}`,
})
const nist = (key: string): Source => ({
  label: 'CODATA 2022 · NIST',
  url: `https://physics.nist.gov/cgi-bin/cuu/Value?${key}`,
})

const E = 1.602176634e-19 // elementary charge in C

// Charge property in units of e, with the SI value for copying.
function charge(eUnits: number, display: string): Property {
  return { label: 'Electric charge', display, numeric: eUnits * E, unit: 'C', source: nist('e') }
}
const spin = (s: string): Property => ({ label: 'Spin (J)', display: s })

export const PARTICLES: Entity[] = [
  {
    id: 'photon',
    kind: 'particle',
    name: 'Photon',
    symbol: 'γ',
    aliases: ['photon', 'gamma', 'γ', 'light quantum', 'photo'],
    summary: 'Quantum of the electromagnetic field; the mediator of the electromagnetic force.',
    properties: [
      { label: 'Mass', display: '0 (massless)', numeric: 0, unit: 'eV', source: pdg('S000') },
      charge(0, '0'),
      spin('1'),
      { label: 'Mean lifetime', display: 'stable', source: pdg('S000') },
    ],
  },
  {
    id: 'electron',
    kind: 'particle',
    name: 'Electron',
    symbol: 'e⁻',
    calcSymbol: 'm_e',
    calcValue: '9.109384e-31 kg',
    aliases: ['electron', 'e', 'e-', 'beta', 'negatron'],
    summary: 'Lightest charged lepton; constituent of atoms.',
    properties: [
      { label: 'Mass (energy)', display: '0.51099895 MeV', numeric: 0.51099895069, unit: 'MeV', source: pdg('S003') },
      { label: 'Mass (SI)', display: '9.1093837e-31 kg', numeric: 9.1093837139e-31, unit: 'kg', source: nist('me') },
      charge(-1, '−1 e'),
      spin('1/2'),
      { label: 'Mean lifetime', display: 'stable (> 6.6×10²⁸ yr)', source: pdg('S003') },
    ],
  },
  {
    id: 'muon',
    kind: 'particle',
    name: 'Muon',
    symbol: 'μ⁻',
    aliases: ['muon', 'mu', 'μ', 'mu lepton'],
    summary: 'Second-generation charged lepton; like a heavy electron.',
    properties: [
      { label: 'Mass (energy)', display: '105.6583755 MeV', numeric: 105.6583755, unit: 'MeV', source: pdg('S004') },
      charge(-1, '−1 e'),
      spin('1/2'),
      { label: 'Mean lifetime', display: '2.1969811×10⁻⁶ s', numeric: 2.1969811e-6, unit: 's', source: pdg('S004') },
    ],
  },
  {
    id: 'tau',
    kind: 'particle',
    name: 'Tau lepton',
    symbol: 'τ⁻',
    aliases: ['tau', 'tau lepton', 'τ', 'tauon'],
    summary: 'Third-generation charged lepton; the heaviest lepton.',
    properties: [
      { label: 'Mass (energy)', display: '1776.93 MeV', numeric: 1776.93, unit: 'MeV', source: pdg('S035') },
      charge(-1, '−1 e'),
      spin('1/2'),
      { label: 'Mean lifetime', display: '2.903×10⁻¹³ s', numeric: 2.903e-13, unit: 's', source: pdg('S035') },
    ],
  },
  {
    id: 'proton',
    kind: 'particle',
    name: 'Proton',
    symbol: 'p',
    calcSymbol: 'm_p',
    calcValue: '1.672622e-27 kg',
    aliases: ['proton', 'p', 'p+', 'hydrogen nucleus'],
    summary: 'Positively charged nucleon (uud); constituent of atomic nuclei.',
    properties: [
      { label: 'Mass (energy)', display: '938.27209 MeV', numeric: 938.27208943, unit: 'MeV', source: pdg('S016') },
      { label: 'Mass (SI)', display: '1.6726219e-27 kg', numeric: 1.67262192595e-27, unit: 'kg', source: nist('mp') },
      charge(1, '+1 e'),
      spin('1/2'),
      { label: 'Mean lifetime', display: 'stable (> 10³⁴ yr)', source: pdg('S016') },
    ],
  },
  {
    id: 'neutron',
    kind: 'particle',
    name: 'Neutron',
    symbol: 'n',
    calcSymbol: 'm_n',
    calcValue: '1.674928e-27 kg',
    aliases: ['neutron', 'n', 'n0'],
    summary: 'Neutral nucleon (udd); free neutrons beta-decay.',
    properties: [
      { label: 'Mass (energy)', display: '939.56542 MeV', numeric: 939.56542194, unit: 'MeV', source: pdg('S017') },
      { label: 'Mass (SI)', display: '1.6749275e-27 kg', numeric: 1.67492750056e-27, unit: 'kg', source: nist('mn') },
      charge(0, '0'),
      spin('1/2'),
      { label: 'Mean lifetime', display: '878.3 s', numeric: 878.3, unit: 's', source: pdg('S017') },
    ],
  },
  {
    id: 'W',
    kind: 'particle',
    name: 'W boson',
    symbol: 'W±',
    calcSymbol: 'm_W',
    calcValue: '1.432592e-25 kg',
    aliases: ['w boson', 'w', 'w particle', 'w+', 'w-', 'w±', 'charged weak boson'],
    summary: 'Charged mediator of the weak interaction.',
    properties: [
      { label: 'Mass (energy)', display: '80.3625 GeV', numeric: 80.3625, unit: 'GeV', source: pdg('S043') },
      { label: 'Decay width', display: '2.085 GeV', numeric: 2.085, unit: 'GeV', source: pdg('S043') },
      charge(1, '±1 e'),
      spin('1'),
    ],
  },
  {
    id: 'Z',
    kind: 'particle',
    name: 'Z boson',
    symbol: 'Z⁰',
    calcSymbol: 'm_Z',
    calcValue: '1.625572e-25 kg',
    aliases: ['z boson', 'z', 'z particle', 'z0', 'neutral weak boson'],
    summary: 'Neutral mediator of the weak interaction.',
    properties: [
      { label: 'Mass (energy)', display: '91.1879 GeV', numeric: 91.1879, unit: 'GeV', source: pdg('S044') },
      { label: 'Decay width', display: '2.4955 GeV', numeric: 2.4955, unit: 'GeV', source: pdg('S044') },
      charge(0, '0'),
      spin('1'),
    ],
  },
  {
    id: 'higgs',
    kind: 'particle',
    name: 'Higgs boson',
    symbol: 'H',
    aliases: ['higgs', 'higgs boson', 'h', 'god particle', 'scalar boson'],
    summary: 'Scalar boson of the Brout–Englert–Higgs mechanism (gives mass to elementary particles).',
    properties: [
      { label: 'Mass (energy)', display: '125.13 GeV', numeric: 125.13, unit: 'GeV', source: pdg('S126') },
      charge(0, '0'),
      spin('0'),
    ],
  },
  {
    id: 'up',
    kind: 'particle',
    name: 'Up quark',
    symbol: 'u',
    aliases: ['up quark', 'up', 'u quark'],
    summary: 'First-generation up-type quark.',
    properties: [
      { label: 'Mass (energy)', display: '2.16 MeV', numeric: 2.16, unit: 'MeV', source: pdg('Q002') },
      charge(2 / 3, '+2/3 e'),
      spin('1/2'),
    ],
  },
  {
    id: 'down',
    kind: 'particle',
    name: 'Down quark',
    symbol: 'd',
    aliases: ['down quark', 'down', 'd quark'],
    summary: 'First-generation down-type quark.',
    properties: [
      { label: 'Mass (energy)', display: '4.70 MeV', numeric: 4.7, unit: 'MeV', source: pdg('Q001') },
      charge(-1 / 3, '−1/3 e'),
      spin('1/2'),
    ],
  },
  {
    id: 'strange',
    kind: 'particle',
    name: 'Strange quark',
    symbol: 's',
    aliases: ['strange quark', 'strange', 's quark'],
    summary: 'Second-generation down-type quark.',
    properties: [
      { label: 'Mass (energy)', display: '92.9 MeV', numeric: 92.9, unit: 'MeV', source: pdg('Q003') },
      charge(-1 / 3, '−1/3 e'),
      spin('1/2'),
    ],
  },
  {
    id: 'charm',
    kind: 'particle',
    name: 'Charm quark',
    symbol: 'c',
    aliases: ['charm quark', 'charm', 'c quark'],
    summary: 'Second-generation up-type quark (MS-bar mass).',
    properties: [
      { label: 'Mass (energy)', display: '1.2729 GeV', numeric: 1.2729, unit: 'GeV', source: pdg('Q004') },
      charge(2 / 3, '+2/3 e'),
      spin('1/2'),
    ],
  },
  {
    id: 'bottom',
    kind: 'particle',
    name: 'Bottom quark',
    symbol: 'b',
    aliases: ['bottom quark', 'bottom', 'b quark', 'beauty quark'],
    summary: 'Third-generation down-type quark (MS-bar mass).',
    properties: [
      { label: 'Mass (energy)', display: '4.1859 GeV', numeric: 4.1859, unit: 'GeV', source: pdg('Q005') },
      charge(-1 / 3, '−1/3 e'),
      spin('1/2'),
    ],
  },
  {
    id: 'top',
    kind: 'particle',
    name: 'Top quark',
    symbol: 't',
    aliases: ['top quark', 'top', 't quark', 'truth quark'],
    summary: 'Third-generation up-type quark; the heaviest known elementary particle.',
    properties: [
      { label: 'Mass (energy)', display: '172.60 GeV', numeric: 172.6, unit: 'GeV', source: pdg('Q007') },
      charge(2 / 3, '+2/3 e'),
      spin('1/2'),
    ],
  },
]
