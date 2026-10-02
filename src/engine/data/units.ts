import { Dimension } from '../dimension'
import { YR_IN_S, type Source } from './constants'

export interface UnitDef {
  symbol: string
  value: number // SI value
  dim: Dimension
  name: string
  prefixable: boolean // may take an SI prefix (e.g. km, MeV, Mpc)
  source: Source
}

const C_LIGHT = 299792458
const QE = 1.602176634e-19

// --- Citation sources --------------------------------------------------------
const SI: Source = { label: 'SI Brochure (BIPM)', url: 'https://www.bipm.org/en/publications/si-brochure' }
const SP811: Source = { label: 'NIST SP 811', url: 'https://www.nist.gov/pml/special-publication-811' }
const IAU: Source = { label: 'IAU units', url: 'https://www.iau.org/publications/proceedings_rules/units/' }
const NIST_eV: Source = { label: 'CODATA 2022 · NIST', url: 'https://physics.nist.gov/cgi-bin/cuu/Value?evj' }
const NIST_u: Source = { label: 'CODATA 2022 · NIST', url: 'https://physics.nist.gov/cgi-bin/cuu/Value?ukg' }

function u(
  symbol: string,
  value: number,
  dim: Dimension,
  name: string,
  source: Source,
  prefixable = true,
): UnitDef {
  return { symbol, value, dim, name, prefixable, source }
}

export const UNITS: UnitDef[] = [
  // ---- SI base (gram is the base for mass so k+g = kg works out to 1 kg) ----
  u('g', 1e-3, Dimension.base(1), 'gram', SI),
  u('m', 1, Dimension.base(0, 1), 'metre', SI),
  u('s', 1, Dimension.base(0, 0, 1), 'second', SI),
  u('K', 1, Dimension.base(0, 0, 0, 0, 1), 'kelvin', SI),
  u('A', 1, Dimension.base(0, 0, 0, 1), 'ampere', SI),
  u('mol', 1, Dimension.base(0, 0, 0, 0, 0, 1), 'mole', SI),
  u('cd', 1, Dimension.base(0, 0, 0, 0, 0, 0, 1), 'candela', SI),

  // ---- Angle & solid angle (dimensionless) ----
  u('rad', 1, Dimension.DIMENSIONLESS, 'radian', SI),
  u('sr', 1, Dimension.DIMENSIONLESS, 'steradian', SI, false),
  u('deg', Math.PI / 180, Dimension.DIMENSIONLESS, 'degree', SI, false),
  u('arcmin', Math.PI / 10800, Dimension.DIMENSIONLESS, 'arcminute', SI, false),
  u('arcsec', Math.PI / 648000, Dimension.DIMENSIONLESS, 'arcsecond', SI, false),
  u('grad', Math.PI / 200, Dimension.DIMENSIONLESS, 'gradian', SP811, false),
  u('turn', 2 * Math.PI, Dimension.DIMENSIONLESS, 'turn (revolution)', SP811, false),

  // ---- SI derived ----
  u('Hz', 1, Dimension.base(0, 0, -1), 'hertz', SI),
  u('N', 1, Dimension.base(1, 1, -2), 'newton', SI),
  u('Pa', 1, Dimension.base(1, -1, -2), 'pascal', SI),
  u('J', 1, Dimension.base(1, 2, -2), 'joule', SI),
  u('W', 1, Dimension.base(1, 2, -3), 'watt', SI),
  u('C', 1, Dimension.base(0, 0, 1, 1), 'coulomb', SI),
  u('V', 1, Dimension.base(1, 2, -3, -1), 'volt', SI),
  u('F', 1, Dimension.base(-1, -2, 4, 2), 'farad', SI),
  u('ohm', 1, Dimension.base(1, 2, -3, -2), 'ohm', SI),
  u('Ω', 1, Dimension.base(1, 2, -3, -2), 'ohm', SI),
  u('S', 1, Dimension.base(-1, -2, 3, 2), 'siemens', SI),
  u('T', 1, Dimension.base(1, 0, -2, -1), 'tesla', SI),
  u('Wb', 1, Dimension.base(1, 2, -2, -1), 'weber', SI),
  u('H', 1, Dimension.base(1, 2, -2, -2), 'henry', SI),
  u('lm', 1, Dimension.base(0, 0, 0, 0, 0, 0, 1), 'lumen', SI),
  u('lx', 1, Dimension.base(0, -2, 0, 0, 0, 0, 1), 'lux', SI),
  u('Bq', 1, Dimension.base(0, 0, -1), 'becquerel', SI),
  u('Gy', 1, Dimension.base(0, 2, -2), 'gray', SI),
  u('Sv', 1, Dimension.base(0, 2, -2), 'sievert', SI),
  u('kat', 1, Dimension.base(0, 0, -1, 0, 0, 1), 'katal', SI),
  u('Ci', 3.7e10, Dimension.base(0, 0, -1), 'curie', SP811, false),
  u('rem', 0.01, Dimension.base(0, 2, -2), 'rem (dose equivalent)', SP811, false),

  // ---- CGS / Gaussian ----
  u('dyn', 1e-5, Dimension.base(1, 1, -2), 'dyne', SP811),
  u('erg', 1e-7, Dimension.base(1, 2, -2), 'erg', SP811),
  u('gauss', 1e-4, Dimension.base(1, 0, -2, -1), 'gauss', SP811),
  u('Oe', 1000 / (4 * Math.PI), Dimension.base(0, -1, 0, 1), 'oersted', SP811, false),
  u('Mx', 1e-8, Dimension.base(1, 2, -2, -1), 'maxwell', SP811, false),
  u('poise', 0.1, Dimension.base(1, -1, -1), 'poise', SP811, false),
  u('St', 1e-4, Dimension.base(0, 2, -1), 'stokes', SP811, false),
  u('statC', 3.335640951982e-10, Dimension.base(0, 0, 1, 1), 'statcoulomb (esu)', SP811, false),
  u('statV', 299.792458, Dimension.base(1, 2, -3, -1), 'statvolt', SP811, false),

  // ---- Energy ----
  u('eV', QE, Dimension.base(1, 2, -2), 'electronvolt', NIST_eV),
  u('cal', 4.184, Dimension.base(1, 2, -2), 'calorie (thermochemical)', SP811),
  u('Wh', 3600, Dimension.base(1, 2, -2), 'watt-hour', SP811),
  u('BTU', 1055.05585262, Dimension.base(1, 2, -2), 'British thermal unit', SP811, false),

  // ---- Power ----
  u('hp', 745.6998715822702, Dimension.base(1, 2, -3), 'horsepower (mechanical)', SP811, false),

  // ---- Pressure ----
  u('bar', 1e5, Dimension.base(1, -1, -2), 'bar', SP811),
  u('atm', 101325, Dimension.base(1, -1, -2), 'standard atmosphere', SP811, false),
  u('torr', 101325 / 760, Dimension.base(1, -1, -2), 'torr', SP811, false),
  u('mmHg', 133.322387415, Dimension.base(1, -1, -2), 'millimetre of mercury', SP811, false),
  u('psi', 6894.757293168361, Dimension.base(1, -1, -2), 'pound per square inch', SP811, false),

  // ---- Force ----
  u('kgf', 9.80665, Dimension.base(1, 1, -2), 'kilogram-force', SP811, false),
  u('lbf', 4.4482216152605, Dimension.base(1, 1, -2), 'pound-force', SP811, false),

  // ---- Frequency / rotation ----
  u('rpm', 1 / 60, Dimension.base(0, 0, -1), 'revolutions per minute', SP811, false),

  // ---- Physics / astronomy ----
  u('b', 1e-28, Dimension.base(0, 2), 'barn', SP811),
  u('Jy', 1e-26, Dimension.base(1, 0, -2), 'jansky', IAU),
  u('AU', 1.495978707e11, Dimension.base(0, 1), 'astronomical unit', IAU, false),
  u('pc', 3.0856775814913673e16, Dimension.base(0, 1), 'parsec', IAU),
  u('ly', C_LIGHT * YR_IN_S, Dimension.base(0, 1), 'light-year', IAU, false),
  u('Da', 1.6605390689e-27, Dimension.base(1), 'dalton', NIST_u, false),
  u('u', 1.6605390689e-27, Dimension.base(1), 'atomic mass unit', NIST_u, false),
  u('amu', 1.6605390689e-27, Dimension.base(1), 'atomic mass unit', NIST_u, false),

  // ---- Length ----
  u('angstrom', 1e-10, Dimension.base(0, 1), 'ångström', SP811, false),
  u('Å', 1e-10, Dimension.base(0, 1), 'ångström', SP811, false),
  u('micron', 1e-6, Dimension.base(0, 1), 'micron (µm)', SP811, false),
  u('fermi', 1e-15, Dimension.base(0, 1), 'fermi (fm)', SP811, false),
  u('nmi', 1852, Dimension.base(0, 1), 'nautical mile', SP811, false),
  u('fathom', 1.8288, Dimension.base(0, 1), 'fathom', SP811, false),
  u('furlong', 201.168, Dimension.base(0, 1), 'furlong', SP811, false),
  u('in_', 0.0254, Dimension.base(0, 1), 'inch', SP811, false),
  u('inch', 0.0254, Dimension.base(0, 1), 'inch', SP811, false),
  u('ft', 0.3048, Dimension.base(0, 1), 'foot', SP811, false),
  u('yd', 0.9144, Dimension.base(0, 1), 'yard', SP811, false),
  u('mi', 1609.344, Dimension.base(0, 1), 'mile', SP811, false),

  // ---- Area ----
  u('ha', 1e4, Dimension.base(0, 2), 'hectare', SI, false),
  u('are', 100, Dimension.base(0, 2), 'are', SP811, false),
  u('acre', 4046.8564224, Dimension.base(0, 2), 'acre', SP811, false),

  // ---- Volume ----
  u('L', 1e-3, Dimension.base(0, 3), 'litre', SI),
  u('gal', 3.785411784e-3, Dimension.base(0, 3), 'US gallon', SP811, false),
  u('qt', 9.46352946e-4, Dimension.base(0, 3), 'US quart', SP811, false),
  u('pt', 4.73176473e-4, Dimension.base(0, 3), 'US pint', SP811, false),
  u('floz', 2.95735295625e-5, Dimension.base(0, 3), 'US fluid ounce', SP811, false),
  u('bbl', 0.158987294928, Dimension.base(0, 3), 'oil barrel', SP811, false),

  // ---- Mass ----
  u('t', 1000, Dimension.base(1), 'tonne (metric ton)', SI, false),
  u('ct', 2e-4, Dimension.base(1), 'carat', SP811, false),
  u('gr', 6.479891e-5, Dimension.base(1), 'grain', SP811, false),
  u('oz', 0.028349523125, Dimension.base(1), 'ounce', SP811, false),
  u('lb', 0.45359237, Dimension.base(1), 'pound', SP811, false),
  u('st', 6.35029318, Dimension.base(1), 'stone', SP811, false),
  u('slug', 14.5939029372, Dimension.base(1), 'slug', SP811, false),

  // ---- Time ----
  u('min', 60, Dimension.base(0, 0, 1), 'minute', SI, false),
  u('hr', 3600, Dimension.base(0, 0, 1), 'hour', SI, false),
  u('day', 86400, Dimension.base(0, 0, 1), 'day', SI, false),
  u('wk', 604800, Dimension.base(0, 0, 1), 'week', SP811, false),
  u('yr', YR_IN_S, Dimension.base(0, 0, 1), 'year (Julian)', IAU, false),

  // ---- Speed ----
  u('kn', 1852 / 3600, Dimension.base(0, 1, -1), 'knot', SP811, false),
  u('mph', 0.44704, Dimension.base(0, 1, -1), 'miles per hour', SP811, false),
  u('kph', 1000 / 3600, Dimension.base(0, 1, -1), 'kilometres per hour', SP811, false),
]
