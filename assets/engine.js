/* ==========================================================================
   engine.js — the natural-units calculation engine. GENERATED, do not edit.

   Built from src/engine/ by scripts/build-engine.mjs (npm run build).
   Exact rational dimension exponents; SI, natural and Gaussian systems with
   every factor derived from the SI defining constants; CODATA 2022 / PDG
   values; expression parser; LaTeX output. Exposed as the global `NU`.
   ========================================================================== */
var NU = (function(exports) {

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

//#region src/engine/fraction.ts
	function gcd(a, b) {
		a = Math.abs(a);
		b = Math.abs(b);
		while (b) [a, b] = [b, a % b];
		return a || 1;
	}
	var Rational = class Rational {
		n;
		d;
		constructor(n, d = 1) {
			if (d === 0) throw new Error("Rational: zero denominator");
			if (!Number.isInteger(n) || !Number.isInteger(d)) throw new Error("Rational: non-integer components");
			if (d < 0) {
				n = -n;
				d = -d;
			}
			const g = gcd(n, d);
			this.n = n / g;
			this.d = d / g;
		}
		static ZERO = new Rational(0);
		static ONE = new Rational(1);
		/** Approximate a real number by a rational with a bounded denominator. */
		static fromNumber(x, maxDen = 1e3) {
			if (Number.isInteger(x)) return new Rational(x);
			if (!Number.isFinite(x)) throw new Error("Rational.fromNumber: non-finite");
			let h0 = 0, h1 = 1, k0 = 1, k1 = 0;
			let b = x;
			const sign = x < 0 ? -1 : 1;
			b = Math.abs(b);
			for (let i = 0; i < 40; i++) {
				const a = Math.floor(b);
				const h2 = a * h1 + h0;
				const k2 = a * k1 + k0;
				if (k2 > maxDen) break;
				h0 = h1;
				h1 = h2;
				k0 = k1;
				k1 = k2;
				const frac = b - a;
				if (frac < 1e-12) break;
				b = 1 / frac;
			}
			return new Rational(sign * h1, k1);
		}
		add(o) {
			return new Rational(this.n * o.d + o.n * this.d, this.d * o.d);
		}
		sub(o) {
			return new Rational(this.n * o.d - o.n * this.d, this.d * o.d);
		}
		mul(o) {
			return new Rational(this.n * o.n, this.d * o.d);
		}
		neg() {
			return new Rational(-this.n, this.d);
		}
		isZero() {
			return this.n === 0;
		}
		equals(o) {
			return this.n === o.n && this.d === o.d;
		}
		toNumber() {
			return this.n / this.d;
		}
		toString() {
			return this.d === 1 ? `${this.n}` : `${this.n}/${this.d}`;
		}
	};
	const R = (n, d = 1) => new Rational(n, d);

//#endregion
//#region src/engine/dimension.ts
	const BASE_UNIT_SYMBOLS = [
		"kg",
		"m",
		"s",
		"A",
		"K",
		"mol",
		"cd"
	];
	const N = 7;
	var Dimension = class Dimension {
		e;
		constructor(e) {
			if (e.length !== N) throw new Error("Dimension: wrong length");
			this.e = e;
		}
		static DIMENSIONLESS = new Dimension([
			Rational.ZERO,
			Rational.ZERO,
			Rational.ZERO,
			Rational.ZERO,
			Rational.ZERO,
			Rational.ZERO,
			Rational.ZERO
		]);
		/** Build from integer exponents, e.g. base(1, 2, -2) for energy (M L^2 T^-2).
		*  Trailing args: I (current), Th (temperature), N (amount), J (luminous). */
		static base(M = 0, L = 0, T = 0, I = 0, Th = 0, Namt = 0, Jlum = 0) {
			return new Dimension([
				R(M),
				R(L),
				R(T),
				R(I),
				R(Th),
				R(Namt),
				R(Jlum)
			]);
		}
		add(o) {
			return new Dimension(this.e.map((x, i) => x.add(o.e[i])));
		}
		sub(o) {
			return new Dimension(this.e.map((x, i) => x.sub(o.e[i])));
		}
		scale(r) {
			return new Dimension(this.e.map((x) => x.mul(r)));
		}
		equals(o) {
			return this.e.every((x, i) => x.equals(o.e[i]));
		}
		isDimensionless() {
			return this.e.every((x) => x.isZero());
		}
		/** Human-readable form, e.g. "kg m^2 s^-2" (empty string if dimensionless). */
		toString() {
			const num = [];
			const den = [];
			this.e.forEach((x, i) => {
				if (x.isZero()) return;
				const sym = BASE_UNIT_SYMBOLS[i];
				const a = x.toNumber();
				if (a > 0) num.push(a === 1 ? sym : `${sym}^${x.toString()}`);
				else den.push(a === -1 ? sym : `${sym}^${x.neg().toString()}`);
			});
			if (num.length === 0 && den.length === 0) return "";
			const top = num.length ? num.join(" ") : "1";
			return den.length ? `${top}/${den.join(" ")}` : top;
		}
	};

//#endregion
//#region src/engine/functions.ts
	const FUNCTIONS = {
		sin: Math.sin,
		cos: Math.cos,
		tan: Math.tan,
		asin: Math.asin,
		acos: Math.acos,
		atan: Math.atan,
		arcsin: Math.asin,
		arccos: Math.acos,
		arctan: Math.atan,
		sinh: Math.sinh,
		cosh: Math.cosh,
		tanh: Math.tanh,
		asinh: Math.asinh,
		acosh: Math.acosh,
		atanh: Math.atanh,
		exp: Math.exp,
		ln: Math.log,
		log: Math.log10,
		log10: Math.log10,
		log2: Math.log2,
		sqrt: Math.sqrt,
		abs: Math.abs
	};
	const FUNCTION_NAMES = new Set(Object.keys(FUNCTIONS));

//#endregion
//#region src/engine/quantity.ts
	var Quantity = class Quantity {
		value;
		dim;
		constructor(value, dim) {
			this.value = value;
			this.dim = dim;
		}
		static dimensionless(value) {
			return new Quantity(value, Dimension.DIMENSIONLESS);
		}
		mul(o) {
			return new Quantity(this.value * o.value, this.dim.add(o.dim));
		}
		div(o) {
			return new Quantity(this.value / o.value, this.dim.sub(o.dim));
		}
		add(o) {
			if (!this.dim.equals(o.dim)) throw new EvalDimError(`cannot add quantities with different dimensions: [${this.dim.toString() || "dimensionless"}] + [${o.dim.toString() || "dimensionless"}]`);
			return new Quantity(this.value + o.value, this.dim);
		}
		sub(o) {
			if (!this.dim.equals(o.dim)) throw new EvalDimError(`cannot subtract quantities with different dimensions: [${this.dim.toString() || "dimensionless"}] - [${o.dim.toString() || "dimensionless"}]`);
			return new Quantity(this.value - o.value, this.dim);
		}
		neg() {
			return new Quantity(-this.value, this.dim);
		}
		/** Raise to a power. Dimensionless bases accept any real exponent; dimensionful
		*  bases require a rational exponent so the resulting dimension is well-defined. */
		pow(exp) {
			if (!exp.dim.isDimensionless()) throw new EvalDimError("exponent must be dimensionless");
			const p = exp.value;
			if (this.dim.isDimensionless()) return Quantity.dimensionless(Math.pow(this.value, p));
			const r = Rational.fromNumber(p);
			if (Math.abs(r.toNumber() - p) > 1e-9) throw new EvalDimError("cannot raise a dimensionful quantity to an irrational power");
			return new Quantity(Math.pow(this.value, p), this.dim.scale(r));
		}
	};
	var EvalDimError = class extends Error {};

//#endregion
//#region src/engine/data/constants.ts
	const nist$1 = (key) => ({
		label: "CODATA 2022 · NIST",
		url: `https://physics.nist.gov/cgi-bin/cuu/Value?${key}`
	});
	const pdg$1 = (node) => ({
		label: "PDG 2026",
		url: `https://pdglive.lbl.gov/Particle.action?node=${node}`
	});
	const SUN = {
		label: "NASA Sun Fact Sheet",
		url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html"
	};
	const EARTH = {
		label: "NASA Earth Fact Sheet",
		url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html"
	};
	const PLANCK = {
		label: "Planck 2018 · arXiv:1807.06209",
		url: "https://arxiv.org/abs/1807.06209"
	};
	const c = 299792458;
	const h = 662607015e-42;
	const hbar = 1054571817e-43;
	const qe = 1602176634e-28;
	const kB = 1380649e-29;
	const NA = 602214076e15;
	const MPC_IN_M = 3085677581491367e7;
	const YR_IN_S = 31557600;
	const gevMass = (gev) => gev * 1e9 * qe / (c * c);
	const CONSTANTS = [
		{
			symbol: "pi",
			value: Math.PI,
			dim: Dimension.DIMENSIONLESS,
			name: "pi",
			source: {
				label: "OEIS A000796",
				url: "https://oeis.org/A000796"
			}
		},
		{
			symbol: "e",
			value: Math.E,
			dim: Dimension.DIMENSIONLESS,
			name: "Euler's number",
			source: {
				label: "OEIS A001113",
				url: "https://oeis.org/A001113"
			}
		},
		{
			symbol: "c",
			value: c,
			dim: Dimension.base(0, 1, -1),
			name: "speed of light",
			source: nist$1("c")
		},
		{
			symbol: "h",
			value: h,
			dim: Dimension.base(1, 2, -1),
			name: "Planck constant",
			source: nist$1("h")
		},
		{
			symbol: "hbar",
			value: hbar,
			dim: Dimension.base(1, 2, -1),
			name: "reduced Planck constant",
			source: nist$1("hbar")
		},
		{
			symbol: "k",
			value: kB,
			dim: Dimension.base(1, 2, -2, 0, -1),
			name: "Boltzmann constant",
			source: nist$1("k")
		},
		{
			symbol: "k_B",
			value: kB,
			dim: Dimension.base(1, 2, -2, 0, -1),
			name: "Boltzmann constant",
			source: nist$1("k")
		},
		{
			symbol: "N_A",
			value: NA,
			dim: Dimension.base(0, 0, 0, 0, 0, -1),
			name: "Avogadro constant",
			source: nist$1("na")
		},
		{
			symbol: "R",
			value: 8.31446261815324,
			dim: Dimension.base(1, 2, -2, 0, -1, -1),
			name: "molar gas constant",
			source: nist$1("r")
		},
		{
			symbol: "G",
			value: 66743e-15,
			dim: Dimension.base(-1, 3, -2),
			name: "gravitational constant",
			source: nist$1("bg")
		},
		{
			symbol: "sigma",
			value: 5.670374419e-8,
			dim: Dimension.base(1, 0, -3, 0, -4),
			name: "Stefan-Boltzmann constant",
			source: nist$1("sigma")
		},
		{
			symbol: "qe",
			value: qe,
			dim: Dimension.base(0, 0, 1, 1),
			name: "elementary charge",
			source: nist$1("e")
		},
		{
			symbol: "eps0",
			value: 88541878188e-22,
			dim: Dimension.base(-1, -3, 4, 2),
			name: "vacuum electric permittivity",
			source: nist$1("ep0")
		},
		{
			symbol: "mu0",
			value: 125663706127e-17,
			dim: Dimension.base(1, 1, -2, -2),
			name: "vacuum magnetic permeability",
			source: nist$1("mu0")
		},
		{
			symbol: "m_e",
			value: 91093837139e-41,
			dim: Dimension.base(1),
			name: "electron mass",
			source: nist$1("me")
		},
		{
			symbol: "m_p",
			value: 167262192595e-38,
			dim: Dimension.base(1),
			name: "proton mass",
			source: nist$1("mp")
		},
		{
			symbol: "m_n",
			value: 167492750056e-38,
			dim: Dimension.base(1),
			name: "neutron mass",
			source: nist$1("mn")
		},
		{
			symbol: "m_W",
			value: gevMass(80.3625),
			dim: Dimension.base(1),
			name: "W boson mass (80.3625 GeV)",
			source: pdg$1("S043")
		},
		{
			symbol: "m_Z",
			value: gevMass(91.1879),
			dim: Dimension.base(1),
			name: "Z boson mass (91.1879 GeV)",
			source: pdg$1("S044")
		},
		{
			symbol: "m_pl",
			value: 2.176434e-8,
			dim: Dimension.base(1),
			name: "Planck mass",
			source: nist$1("plkm")
		},
		{
			symbol: "M_Sun",
			value: 19885e26,
			dim: Dimension.base(1),
			name: "solar mass",
			source: SUN
		},
		{
			symbol: "R_Sun",
			value: 6957e5,
			dim: Dimension.base(0, 1),
			name: "solar radius",
			source: SUN
		},
		{
			symbol: "M_Earth",
			value: 59722e20,
			dim: Dimension.base(1),
			name: "Earth mass",
			source: EARTH
		},
		{
			symbol: "R_Earth",
			value: 6371e3,
			dim: Dimension.base(0, 1),
			name: "Earth mean radius",
			source: EARTH
		},
		{
			symbol: "H0",
			value: 67.4 * 1e3 / MPC_IN_M,
			dim: Dimension.base(0, 0, -1),
			name: "Hubble constant (67.4 km/s/Mpc)",
			source: PLANCK
		}
	];

//#endregion
//#region src/engine/data/prefixes.ts
	const PREFIXES = {
		Y: 1e24,
		Z: 1e21,
		E: 0xde0b6b3a7640000,
		P: 0x38d7ea4c68000,
		T: 0xe8d4a51000,
		G: 1e9,
		M: 1e6,
		k: 1e3,
		h: 100,
		da: 10,
		d: .1,
		c: .01,
		m: .001,
		u: 1e-6,
		µ: 1e-6,
		μ: 1e-6,
		n: 1e-9,
		p: 1e-12,
		f: 1e-15,
		a: 1e-18,
		z: 1e-21,
		y: 1e-24
	};
	const PREFIX_SYMBOLS = Object.keys(PREFIXES).sort((a, b) => b.length - a.length);

//#endregion
//#region src/engine/data/units.ts
	const C_LIGHT = 299792458;
	const QE$1 = 1602176634e-28;
	const SI = {
		label: "SI Brochure (BIPM)",
		url: "https://www.bipm.org/en/publications/si-brochure"
	};
	const SP811 = {
		label: "NIST SP 811",
		url: "https://www.nist.gov/pml/special-publication-811"
	};
	const IAU = {
		label: "IAU units",
		url: "https://www.iau.org/publications/proceedings_rules/units/"
	};
	const NIST_eV = {
		label: "CODATA 2022 · NIST",
		url: "https://physics.nist.gov/cgi-bin/cuu/Value?evj"
	};
	const NIST_u = {
		label: "CODATA 2022 · NIST",
		url: "https://physics.nist.gov/cgi-bin/cuu/Value?ukg"
	};
	function u(symbol, value, dim, name, source, prefixable = true) {
		return {
			symbol,
			value,
			dim,
			name,
			prefixable,
			source
		};
	}
	const UNITS = [
		u("g", .001, Dimension.base(1), "gram", SI),
		u("m", 1, Dimension.base(0, 1), "metre", SI),
		u("s", 1, Dimension.base(0, 0, 1), "second", SI),
		u("K", 1, Dimension.base(0, 0, 0, 0, 1), "kelvin", SI),
		u("A", 1, Dimension.base(0, 0, 0, 1), "ampere", SI),
		u("mol", 1, Dimension.base(0, 0, 0, 0, 0, 1), "mole", SI),
		u("cd", 1, Dimension.base(0, 0, 0, 0, 0, 0, 1), "candela", SI),
		u("rad", 1, Dimension.DIMENSIONLESS, "radian", SI),
		u("sr", 1, Dimension.DIMENSIONLESS, "steradian", SI, false),
		u("deg", Math.PI / 180, Dimension.DIMENSIONLESS, "degree", SI, false),
		u("arcmin", Math.PI / 10800, Dimension.DIMENSIONLESS, "arcminute", SI, false),
		u("arcsec", Math.PI / 648e3, Dimension.DIMENSIONLESS, "arcsecond", SI, false),
		u("grad", Math.PI / 200, Dimension.DIMENSIONLESS, "gradian", SP811, false),
		u("turn", 2 * Math.PI, Dimension.DIMENSIONLESS, "turn (revolution)", SP811, false),
		u("Hz", 1, Dimension.base(0, 0, -1), "hertz", SI),
		u("N", 1, Dimension.base(1, 1, -2), "newton", SI),
		u("Pa", 1, Dimension.base(1, -1, -2), "pascal", SI),
		u("J", 1, Dimension.base(1, 2, -2), "joule", SI),
		u("W", 1, Dimension.base(1, 2, -3), "watt", SI),
		u("C", 1, Dimension.base(0, 0, 1, 1), "coulomb", SI),
		u("V", 1, Dimension.base(1, 2, -3, -1), "volt", SI),
		u("F", 1, Dimension.base(-1, -2, 4, 2), "farad", SI),
		u("ohm", 1, Dimension.base(1, 2, -3, -2), "ohm", SI),
		u("Ω", 1, Dimension.base(1, 2, -3, -2), "ohm", SI),
		u("S", 1, Dimension.base(-1, -2, 3, 2), "siemens", SI),
		u("T", 1, Dimension.base(1, 0, -2, -1), "tesla", SI),
		u("Wb", 1, Dimension.base(1, 2, -2, -1), "weber", SI),
		u("H", 1, Dimension.base(1, 2, -2, -2), "henry", SI),
		u("lm", 1, Dimension.base(0, 0, 0, 0, 0, 0, 1), "lumen", SI),
		u("lx", 1, Dimension.base(0, -2, 0, 0, 0, 0, 1), "lux", SI),
		u("Bq", 1, Dimension.base(0, 0, -1), "becquerel", SI),
		u("Gy", 1, Dimension.base(0, 2, -2), "gray", SI),
		u("Sv", 1, Dimension.base(0, 2, -2), "sievert", SI),
		u("kat", 1, Dimension.base(0, 0, -1, 0, 0, 1), "katal", SI),
		u("Ci", 37e9, Dimension.base(0, 0, -1), "curie", SP811, false),
		u("rem", .01, Dimension.base(0, 2, -2), "rem (dose equivalent)", SP811, false),
		u("dyn", 1e-5, Dimension.base(1, 1, -2), "dyne", SP811),
		u("erg", 1e-7, Dimension.base(1, 2, -2), "erg", SP811),
		u("gauss", 1e-4, Dimension.base(1, 0, -2, -1), "gauss", SP811),
		u("Oe", 1e3 / (4 * Math.PI), Dimension.base(0, -1, 0, 1), "oersted", SP811, false),
		u("Mx", 1e-8, Dimension.base(1, 2, -2, -1), "maxwell", SP811, false),
		u("poise", .1, Dimension.base(1, -1, -1), "poise", SP811, false),
		u("St", 1e-4, Dimension.base(0, 2, -1), "stokes", SP811, false),
		u("statC", 3335640951982e-22, Dimension.base(0, 0, 1, 1), "statcoulomb (esu)", SP811, false),
		u("statV", 299.792458, Dimension.base(1, 2, -3, -1), "statvolt", SP811, false),
		u("eV", QE$1, Dimension.base(1, 2, -2), "electronvolt", NIST_eV),
		u("cal", 4.184, Dimension.base(1, 2, -2), "calorie (thermochemical)", SP811),
		u("Wh", 3600, Dimension.base(1, 2, -2), "watt-hour", SP811),
		u("BTU", 1055.05585262, Dimension.base(1, 2, -2), "British thermal unit", SP811, false),
		u("hp", 745.6998715822702, Dimension.base(1, 2, -3), "horsepower (mechanical)", SP811, false),
		u("bar", 1e5, Dimension.base(1, -1, -2), "bar", SP811),
		u("atm", 101325, Dimension.base(1, -1, -2), "standard atmosphere", SP811, false),
		u("torr", 101325 / 760, Dimension.base(1, -1, -2), "torr", SP811, false),
		u("mmHg", 133.322387415, Dimension.base(1, -1, -2), "millimetre of mercury", SP811, false),
		u("psi", 6894.757293168361, Dimension.base(1, -1, -2), "pound per square inch", SP811, false),
		u("kgf", 9.80665, Dimension.base(1, 1, -2), "kilogram-force", SP811, false),
		u("lbf", 4.4482216152605, Dimension.base(1, 1, -2), "pound-force", SP811, false),
		u("rpm", 1 / 60, Dimension.base(0, 0, -1), "revolutions per minute", SP811, false),
		u("b", 1e-28, Dimension.base(0, 2), "barn", SP811),
		u("Jy", 1e-26, Dimension.base(1, 0, -2), "jansky", IAU),
		u("AU", 149597870700, Dimension.base(0, 1), "astronomical unit", IAU, false),
		u("pc", 0x6da012f95c9e88, Dimension.base(0, 1), "parsec", IAU),
		u("ly", C_LIGHT * YR_IN_S, Dimension.base(0, 1), "light-year", IAU, false),
		u("Da", 16605390689e-37, Dimension.base(1), "dalton", NIST_u, false),
		u("u", 16605390689e-37, Dimension.base(1), "atomic mass unit", NIST_u, false),
		u("amu", 16605390689e-37, Dimension.base(1), "atomic mass unit", NIST_u, false),
		u("angstrom", 1e-10, Dimension.base(0, 1), "ångström", SP811, false),
		u("Å", 1e-10, Dimension.base(0, 1), "ångström", SP811, false),
		u("micron", 1e-6, Dimension.base(0, 1), "micron (µm)", SP811, false),
		u("fermi", 1e-15, Dimension.base(0, 1), "fermi (fm)", SP811, false),
		u("nmi", 1852, Dimension.base(0, 1), "nautical mile", SP811, false),
		u("fathom", 1.8288, Dimension.base(0, 1), "fathom", SP811, false),
		u("furlong", 201.168, Dimension.base(0, 1), "furlong", SP811, false),
		u("in_", .0254, Dimension.base(0, 1), "inch", SP811, false),
		u("inch", .0254, Dimension.base(0, 1), "inch", SP811, false),
		u("ft", .3048, Dimension.base(0, 1), "foot", SP811, false),
		u("yd", .9144, Dimension.base(0, 1), "yard", SP811, false),
		u("mi", 1609.344, Dimension.base(0, 1), "mile", SP811, false),
		u("ha", 1e4, Dimension.base(0, 2), "hectare", SI, false),
		u("are", 100, Dimension.base(0, 2), "are", SP811, false),
		u("acre", 4046.8564224, Dimension.base(0, 2), "acre", SP811, false),
		u("L", .001, Dimension.base(0, 3), "litre", SI),
		u("gal", .003785411784, Dimension.base(0, 3), "US gallon", SP811, false),
		u("qt", .000946352946, Dimension.base(0, 3), "US quart", SP811, false),
		u("pt", .000473176473, Dimension.base(0, 3), "US pint", SP811, false),
		u("floz", 295735295625e-16, Dimension.base(0, 3), "US fluid ounce", SP811, false),
		u("bbl", .158987294928, Dimension.base(0, 3), "oil barrel", SP811, false),
		u("t", 1e3, Dimension.base(1), "tonne (metric ton)", SI, false),
		u("ct", 2e-4, Dimension.base(1), "carat", SP811, false),
		u("gr", 6479891e-11, Dimension.base(1), "grain", SP811, false),
		u("oz", .028349523125, Dimension.base(1), "ounce", SP811, false),
		u("lb", .45359237, Dimension.base(1), "pound", SP811, false),
		u("st", 6.35029318, Dimension.base(1), "stone", SP811, false),
		u("slug", 14.5939029372, Dimension.base(1), "slug", SP811, false),
		u("min", 60, Dimension.base(0, 0, 1), "minute", SI, false),
		u("hr", 3600, Dimension.base(0, 0, 1), "hour", SI, false),
		u("day", 86400, Dimension.base(0, 0, 1), "day", SI, false),
		u("wk", 604800, Dimension.base(0, 0, 1), "week", SP811, false),
		u("yr", YR_IN_S, Dimension.base(0, 0, 1), "year (Julian)", IAU, false),
		u("kn", 1852 / 3600, Dimension.base(0, 1, -1), "knot", SP811, false),
		u("mph", .44704, Dimension.base(0, 1, -1), "miles per hour", SP811, false),
		u("kph", 1e3 / 3600, Dimension.base(0, 1, -1), "kilometres per hour", SP811, false)
	];

//#endregion
//#region src/engine/symbols.ts
	const CONST_MAP = new Map(CONSTANTS.map((c) => [c.symbol, c]));
	const UNIT_MAP = new Map(UNITS.map((un) => [un.symbol, un]));
	/**
	* Resolve an identifier to a quantity, trying in order:
	*   1. a physical constant (whole token)   -> e.g. c, hbar, m_p, G
	*   2. a unit (whole token)                -> e.g. eV, min, pc
	*   3. an SI prefix + prefixable unit       -> e.g. GeV, Mpc, ms, km
	* Whole-token matches win first, so `min` is a minute (not milli-inch) and
	* `G` is Newton's constant (not the giga prefix on nothing).
	*/
	function resolveSymbol(name) {
		const c = CONST_MAP.get(name);
		if (c) return {
			quantity: new Quantity(c.value, c.dim),
			kind: "constant"
		};
		const un = UNIT_MAP.get(name);
		if (un) return {
			quantity: new Quantity(un.value, un.dim),
			kind: "unit"
		};
		for (const p of PREFIX_SYMBOLS) if (name.length > p.length && name.startsWith(p)) {
			const rest = UNIT_MAP.get(name.slice(p.length));
			if (rest && rest.prefixable) return {
				quantity: new Quantity(PREFIXES[p] * rest.value, rest.dim),
				kind: "unit"
			};
		}
		return null;
	}
	/** Describe an identifier (for citations): which constant or unit it refers to. */
	function describeSymbol(name) {
		const c = CONST_MAP.get(name);
		if (c) return {
			kind: "constant",
			def: c
		};
		const un = UNIT_MAP.get(name);
		if (un) return {
			kind: "unit",
			def: un
		};
		for (const p of PREFIX_SYMBOLS) if (name.length > p.length && name.startsWith(p)) {
			const rest = UNIT_MAP.get(name.slice(p.length));
			if (rest && rest.prefixable) return {
				kind: "unit",
				def: rest,
				prefix: p
			};
		}
		return null;
	}

//#endregion
//#region src/engine/evaluate.ts
	var EvalError = class extends Error {};
	/** Evaluate an AST node (excluding a top-level `convert`) to an SI quantity. */
	function evaluate(node) {
		switch (node.kind) {
			case "num": return Quantity.dimensionless(node.value);
			case "ident": {
				const r = resolveSymbol(node.name);
				if (!r) throw new EvalError(`unknown symbol '${node.name}'`);
				return r.quantity;
			}
			case "unary": {
				const v = evaluate(node.arg);
				return node.op === "-" ? v.neg() : v;
			}
			case "binary": {
				const l = evaluate(node.left);
				const r = evaluate(node.right);
				switch (node.op) {
					case "+": return l.add(r);
					case "-": return l.sub(r);
					case "*": return l.mul(r);
					case "/": return l.div(r);
				}
				break;
			}
			case "pow": {
				const base = evaluate(node.base);
				const exp = evaluate(node.exp);
				return base.pow(exp);
			}
			case "call": {
				const arg = evaluate(node.arg);
				if (node.name === "sqrt") return arg.pow(Quantity.dimensionless(.5));
				if (node.name === "abs") return new Quantity(Math.abs(arg.value), arg.dim);
				const fn = FUNCTIONS[node.name];
				if (!fn) throw new EvalError(`unknown function '${node.name}'`);
				if (!arg.dim.isDimensionless()) throw new EvalDimError(`${node.name}() requires a dimensionless argument`);
				return Quantity.dimensionless(fn(arg.value));
			}
			case "convert": throw new EvalError("unexpected conversion (in/to) here");
		}
		throw new EvalError("could not evaluate expression");
	}

//#endregion
//#region src/engine/systems.ts
	const UNIT_SYSTEMS = [
		{
			id: "SI",
			label: "SI",
			hint: "metres, kilograms, seconds"
		},
		{
			id: "natural",
			label: "Natural",
			hint: "ħ = c = kʙ = 1, energy in eV"
		},
		{
			id: "gaussian",
			label: "Gaussian",
			hint: "CGS-Gaussian, c = 1 (experimental)"
		}
	];
	const C = 299792458;
	const HBAR = 1054571817e-43;
	const QE = 1602176634e-28;
	const KB = 1380649e-29;
	const EPS0 = 88541878188e-22;
	const KG_TO_EV = C * C / QE;
	const M_TO_INV_EV = QE / (HBAR * C);
	const S_TO_INV_EV = QE / HBAR;
	const K_TO_EV = KB / QE;
	const A_TO_EV = HBAR / QE / Math.sqrt(EPS0 * HBAR * C);
	/** Reduce an SI quantity to natural units (ħ = c = k_B = ε0 = 1). */
	function toNatural(q) {
		const [eM, eL, eT, eI, eTh, eMol, eCd] = q.dim.e.map((r) => r.toNumber());
		return {
			coef: q.value * Math.pow(KG_TO_EV, eM) * Math.pow(M_TO_INV_EV, eL) * Math.pow(S_TO_INV_EV, eT) * Math.pow(K_TO_EV, eTh) * Math.pow(A_TO_EV, eI),
			energyExp: eM - eL - eT + eTh + eI,
			residual: {
				mol: eMol,
				cd: eCd
			}
		};
	}
	const EPS = 1e-9;
	const close = (a, b) => Math.abs(a - b) < EPS;
	/** Convert `source` into multiples of `target` within the given unit system. */
	function convert(source, target, system) {
		if (system === "natural") {
			const a = toNatural(source);
			const b = toNatural(target);
			const residualOk = close(a.residual.mol, b.residual.mol) && close(a.residual.cd, b.residual.cd);
			if (!close(a.energyExp, b.energyExp) || !residualOk) return {
				ratio: NaN,
				ok: false,
				reason: `incompatible in natural units: energy dimension eV^${fmtExp$1(a.energyExp)} vs eV^${fmtExp$1(b.energyExp)}`
			};
			return {
				ratio: a.coef / b.coef,
				ok: true
			};
		}
		if (!source.dim.equals(target.dim)) return {
			ratio: NaN,
			ok: false,
			reason: `incompatible dimensions: [${source.dim.toString() || "dimensionless"}] vs [${target.dim.toString() || "dimensionless"}]`
		};
		return {
			ratio: source.value / target.value,
			ok: true
		};
	}
	function fmtExp$1(x) {
		const r = Math.round(x);
		return close(x, r) ? `${r}` : x.toFixed(3);
	}

//#endregion
//#region src/engine/format.ts
/** Format a number with a fixed number of significant figures, choosing plain
	*  or scientific notation, and trimming trailing zeros. */
	function fmtNum(x, sig = 7) {
		if (x === 0) return "0";
		if (!Number.isFinite(x)) return x > 0 ? "∞" : x < 0 ? "−∞" : "NaN";
		const abs = Math.abs(x);
		if (abs >= 1e6 || abs < 1e-4) {
			const [m, e] = x.toExponential(sig - 1).split("e");
			return `${trim(m)}e${Number(e)}`;
		}
		return trim(x.toPrecision(sig));
	}
	function trim(s) {
		if (!s.includes(".")) return s;
		return s.replace(/\.?0+$/, "");
	}
	const DERIVED = [
		{
			symbol: "N",
			dim: Dimension.base(1, 1, -2)
		},
		{
			symbol: "J",
			dim: Dimension.base(1, 2, -2)
		},
		{
			symbol: "W",
			dim: Dimension.base(1, 2, -3)
		},
		{
			symbol: "Pa",
			dim: Dimension.base(1, -1, -2)
		},
		{
			symbol: "C",
			dim: Dimension.base(0, 0, 1, 1)
		},
		{
			symbol: "V",
			dim: Dimension.base(1, 2, -3, -1)
		},
		{
			symbol: "F",
			dim: Dimension.base(-1, -2, 4, 2)
		},
		{
			symbol: "ohm",
			dim: Dimension.base(1, 2, -3, -2)
		},
		{
			symbol: "T",
			dim: Dimension.base(1, 0, -2, -1)
		},
		{
			symbol: "Wb",
			dim: Dimension.base(1, 2, -2, -1)
		},
		{
			symbol: "H",
			dim: Dimension.base(1, 2, -2, -2)
		},
		{
			symbol: "Hz",
			dim: Dimension.base(0, 0, -1)
		}
	];
	/** Display a quantity in SI: value in base units, plus a named derived unit
	*  when the dimension matches one (e.g. "1.5033e-10 J"). */
	function formatSI(q) {
		const base = q.dim.toString();
		const num = fmtNum(q.value);
		if (q.dim.isDimensionless()) return {
			value: q.value,
			unit: "",
			display: num
		};
		const derived = DERIVED.find((d) => d.dim.equals(q.dim));
		const unit = derived ? derived.symbol : base;
		return {
			value: q.value,
			unit,
			display: `${num} ${unit}`
		};
	}
	const ENERGY_PREFIXES = [
		{
			p: "PeV",
			f: 0x38d7ea4c68000
		},
		{
			p: "TeV",
			f: 0xe8d4a51000
		},
		{
			p: "GeV",
			f: 1e9
		},
		{
			p: "MeV",
			f: 1e6
		},
		{
			p: "keV",
			f: 1e3
		},
		{
			p: "eV",
			f: 1
		},
		{
			p: "meV",
			f: .001
		}
	];
	/** Display a quantity in natural units (ħ = c = k_B = 1) as a power of eV. */
	function formatNatural(q) {
		const nf = toNatural(q);
		const p = Math.round(nf.energyExp);
		const isInt = Math.abs(nf.energyExp - p) < 1e-9;
		const residualPart = [["mol", nf.residual.mol], ["cd", nf.residual.cd]].filter(([, v]) => Math.abs(v) > 1e-9).map(([sym, v]) => Math.abs(v - 1) < 1e-9 ? ` ${sym}` : ` ${sym}^${fmtExp(v)}`).join("");
		if (isInt && p === 1 && !residualPart && Number.isFinite(nf.coef) && nf.coef !== 0) {
			const abs = Math.abs(nf.coef);
			const pick = ENERGY_PREFIXES.find((e) => abs >= e.f) ?? ENERGY_PREFIXES[ENERGY_PREFIXES.length - 1];
			const v = nf.coef / pick.f;
			return {
				value: v,
				unit: pick.p,
				display: `${fmtNum(v)} ${pick.p}`
			};
		}
		const unit = `${isInt ? p === 0 ? "" : `eV^${p}` : `eV^${fmtExp(nf.energyExp)}`}${residualPart}`.trim();
		const display = unit ? `${fmtNum(nf.coef)} ${unit}` : fmtNum(nf.coef);
		return {
			value: nf.coef,
			unit,
			display
		};
	}
	function fmtExp(x) {
		const r = Math.round(x);
		return Math.abs(x - r) < 1e-9 ? `${r}` : x.toFixed(3);
	}

//#endregion
//#region src/engine/tokenizer.ts
	const IDENT_START = /[A-Za-zµμÅåΩω]/;
	const IDENT_PART = /[A-Za-z0-9_µμÅåΩω]/;
	const DIGIT = /[0-9]/;
	var ParseError = class extends Error {};
	function tokenize(input) {
		const tokens = [];
		let i = 0;
		const n = input.length;
		while (i < n) {
			const ch = input[i];
			if (ch === " " || ch === "	" || ch === "\n" || ch === "\r") {
				i++;
				continue;
			}
			if (DIGIT.test(ch) || ch === "." && DIGIT.test(input[i + 1] ?? "")) {
				const start = i;
				while (i < n && DIGIT.test(input[i])) i++;
				if (input[i] === ".") {
					i++;
					while (i < n && DIGIT.test(input[i])) i++;
				}
				if (input[i] === "e" || input[i] === "E") {
					let j = i + 1;
					if (input[j] === "+" || input[j] === "-") j++;
					if (DIGIT.test(input[j] ?? "")) {
						i = j;
						while (i < n && DIGIT.test(input[i])) i++;
					}
				}
				tokens.push({
					type: "number",
					value: input.slice(start, i),
					pos: start
				});
				continue;
			}
			if (IDENT_START.test(ch)) {
				const start = i;
				while (i < n && IDENT_PART.test(input[i])) i++;
				const word = input.slice(start, i);
				if (word === "in" || word === "to") tokens.push({
					type: "convert",
					value: word,
					pos: start
				});
				else tokens.push({
					type: "ident",
					value: word,
					pos: start
				});
				continue;
			}
			if (ch === "-" && input[i + 1] === ">") {
				tokens.push({
					type: "convert",
					value: "->",
					pos: i
				});
				i += 2;
				continue;
			}
			if ("+-*/^".includes(ch)) {
				tokens.push({
					type: "op",
					value: ch,
					pos: i
				});
				i++;
				continue;
			}
			if (ch === "(") {
				tokens.push({
					type: "lparen",
					value: ch,
					pos: i
				});
				i++;
				continue;
			}
			if (ch === ")") {
				tokens.push({
					type: "rparen",
					value: ch,
					pos: i
				});
				i++;
				continue;
			}
			throw new ParseError(`unexpected character '${ch}' at position ${i}`);
		}
		tokens.push({
			type: "eof",
			value: "",
			pos: n
		});
		return tokens;
	}

//#endregion
//#region src/engine/parser.ts
	var Parser = class {
		pos = 0;
		tokens;
		input;
		constructor(tokens, input) {
			this.tokens = tokens;
			this.input = input;
		}
		peek() {
			return this.tokens[this.pos];
		}
		next() {
			return this.tokens[this.pos++];
		}
		expect(type) {
			const t = this.peek();
			if (t.type !== type) throw new ParseError(`expected ${type} but found '${t.value || "end"}'`);
			return this.next();
		}
		parse() {
			const node = this.parseConvert();
			if (this.peek().type !== "eof") throw new ParseError(`unexpected '${this.peek().value}'`);
			return node;
		}
		parseConvert() {
			const expr = this.parseAdd();
			if (this.peek().type === "convert") {
				this.next();
				const start = this.peek().pos;
				const target = this.parseAdd();
				const end = this.peek().pos;
				return {
					kind: "convert",
					expr,
					target,
					targetText: this.input.slice(start, end).trim()
				};
			}
			return expr;
		}
		parseAdd() {
			let left = this.parseMul();
			while (this.peek().type === "op" && (this.peek().value === "+" || this.peek().value === "-")) {
				const op = this.next().value;
				const right = this.parseMul();
				left = {
					kind: "binary",
					op,
					left,
					right
				};
			}
			return left;
		}
		parseMul() {
			let left = this.parseUnary();
			for (;;) {
				const t = this.peek();
				if (t.type === "op" && (t.value === "*" || t.value === "/")) {
					const op = this.next().value;
					const right = this.parseUnary();
					left = {
						kind: "binary",
						op,
						left,
						right
					};
				} else if (this.startsFactor(t)) {
					const right = this.parseUnary();
					left = {
						kind: "binary",
						op: "*",
						left,
						right
					};
				} else break;
			}
			return left;
		}
		startsFactor(t) {
			return t.type === "number" || t.type === "ident" || t.type === "lparen";
		}
		parseUnary() {
			const t = this.peek();
			if (t.type === "op" && (t.value === "+" || t.value === "-")) return {
				kind: "unary",
				op: this.next().value,
				arg: this.parseUnary()
			};
			return this.parsePow();
		}
		parsePow() {
			const base = this.parsePrimary();
			if (this.peek().type === "op" && this.peek().value === "^") {
				this.next();
				return {
					kind: "pow",
					base,
					exp: this.parseUnary()
				};
			}
			return base;
		}
		parsePrimary() {
			const t = this.peek();
			if (t.type === "number") {
				this.next();
				return {
					kind: "num",
					value: Number(t.value)
				};
			}
			if (t.type === "ident") {
				this.next();
				if (FUNCTION_NAMES.has(t.value) && this.peek().type === "lparen") {
					this.next();
					const arg = this.parseAdd();
					this.expect("rparen");
					return {
						kind: "call",
						name: t.value,
						arg
					};
				}
				return {
					kind: "ident",
					name: t.value
				};
			}
			if (t.type === "lparen") {
				this.next();
				const inner = this.parseAdd();
				this.expect("rparen");
				return inner;
			}
			throw new ParseError(`unexpected '${t.value || "end of input"}'`);
		}
	};
	function parse(input) {
		return new Parser(tokenize(input), input).parse();
	}

//#endregion
//#region src/engine/data/particles.ts
	const pdg = (node) => ({
		label: "PDG 2026",
		url: `https://pdglive.lbl.gov/Particle.action?node=${node}`
	});
	const nist = (key) => ({
		label: "CODATA 2022 · NIST",
		url: `https://physics.nist.gov/cgi-bin/cuu/Value?${key}`
	});
	const E = 1602176634e-28;
	function charge(eUnits, display) {
		return {
			label: "Electric charge",
			display,
			numeric: eUnits * E,
			unit: "C",
			source: nist("e")
		};
	}
	const spin = (s) => ({
		label: "Spin (J)",
		display: s
	});
	const PARTICLES = [
		{
			id: "photon",
			kind: "particle",
			name: "Photon",
			symbol: "γ",
			aliases: [
				"photon",
				"gamma",
				"γ",
				"light quantum",
				"photo"
			],
			summary: "Quantum of the electromagnetic field; the mediator of the electromagnetic force.",
			properties: [
				{
					label: "Mass",
					display: "0 (massless)",
					numeric: 0,
					unit: "eV",
					source: pdg("S000")
				},
				charge(0, "0"),
				spin("1"),
				{
					label: "Mean lifetime",
					display: "stable",
					source: pdg("S000")
				}
			]
		},
		{
			id: "electron",
			kind: "particle",
			name: "Electron",
			symbol: "e⁻",
			calcSymbol: "m_e",
			calcValue: "9.109384e-31 kg",
			aliases: [
				"electron",
				"e",
				"e-",
				"beta",
				"negatron"
			],
			summary: "Lightest charged lepton; constituent of atoms.",
			properties: [
				{
					label: "Mass (energy)",
					display: "0.51099895 MeV",
					numeric: .51099895069,
					unit: "MeV",
					source: pdg("S003")
				},
				{
					label: "Mass (SI)",
					display: "9.1093837e-31 kg",
					numeric: 91093837139e-41,
					unit: "kg",
					source: nist("me")
				},
				charge(-1, "−1 e"),
				spin("1/2"),
				{
					label: "Mean lifetime",
					display: "stable (> 6.6×10²⁸ yr)",
					source: pdg("S003")
				}
			]
		},
		{
			id: "muon",
			kind: "particle",
			name: "Muon",
			symbol: "μ⁻",
			aliases: [
				"muon",
				"mu",
				"μ",
				"mu lepton"
			],
			summary: "Second-generation charged lepton; like a heavy electron.",
			properties: [
				{
					label: "Mass (energy)",
					display: "105.6583755 MeV",
					numeric: 105.6583755,
					unit: "MeV",
					source: pdg("S004")
				},
				charge(-1, "−1 e"),
				spin("1/2"),
				{
					label: "Mean lifetime",
					display: "2.1969811×10⁻⁶ s",
					numeric: 21969811e-13,
					unit: "s",
					source: pdg("S004")
				}
			]
		},
		{
			id: "tau",
			kind: "particle",
			name: "Tau lepton",
			symbol: "τ⁻",
			aliases: [
				"tau",
				"tau lepton",
				"τ",
				"tauon"
			],
			summary: "Third-generation charged lepton; the heaviest lepton.",
			properties: [
				{
					label: "Mass (energy)",
					display: "1776.93 MeV",
					numeric: 1776.93,
					unit: "MeV",
					source: pdg("S035")
				},
				charge(-1, "−1 e"),
				spin("1/2"),
				{
					label: "Mean lifetime",
					display: "2.903×10⁻¹³ s",
					numeric: 2903e-16,
					unit: "s",
					source: pdg("S035")
				}
			]
		},
		{
			id: "proton",
			kind: "particle",
			name: "Proton",
			symbol: "p",
			calcSymbol: "m_p",
			calcValue: "1.672622e-27 kg",
			aliases: [
				"proton",
				"p",
				"p+",
				"hydrogen nucleus"
			],
			summary: "Positively charged nucleon (uud); constituent of atomic nuclei.",
			properties: [
				{
					label: "Mass (energy)",
					display: "938.27209 MeV",
					numeric: 938.27208943,
					unit: "MeV",
					source: pdg("S016")
				},
				{
					label: "Mass (SI)",
					display: "1.6726219e-27 kg",
					numeric: 167262192595e-38,
					unit: "kg",
					source: nist("mp")
				},
				charge(1, "+1 e"),
				spin("1/2"),
				{
					label: "Mean lifetime",
					display: "stable (> 10³⁴ yr)",
					source: pdg("S016")
				}
			]
		},
		{
			id: "neutron",
			kind: "particle",
			name: "Neutron",
			symbol: "n",
			calcSymbol: "m_n",
			calcValue: "1.674928e-27 kg",
			aliases: [
				"neutron",
				"n",
				"n0"
			],
			summary: "Neutral nucleon (udd); free neutrons beta-decay.",
			properties: [
				{
					label: "Mass (energy)",
					display: "939.56542 MeV",
					numeric: 939.56542194,
					unit: "MeV",
					source: pdg("S017")
				},
				{
					label: "Mass (SI)",
					display: "1.6749275e-27 kg",
					numeric: 167492750056e-38,
					unit: "kg",
					source: nist("mn")
				},
				charge(0, "0"),
				spin("1/2"),
				{
					label: "Mean lifetime",
					display: "878.3 s",
					numeric: 878.3,
					unit: "s",
					source: pdg("S017")
				}
			]
		},
		{
			id: "W",
			kind: "particle",
			name: "W boson",
			symbol: "W±",
			calcSymbol: "m_W",
			calcValue: "1.432592e-25 kg",
			aliases: [
				"w boson",
				"w",
				"w particle",
				"w+",
				"w-",
				"w±",
				"charged weak boson"
			],
			summary: "Charged mediator of the weak interaction.",
			properties: [
				{
					label: "Mass (energy)",
					display: "80.3625 GeV",
					numeric: 80.3625,
					unit: "GeV",
					source: pdg("S043")
				},
				{
					label: "Decay width",
					display: "2.085 GeV",
					numeric: 2.085,
					unit: "GeV",
					source: pdg("S043")
				},
				charge(1, "±1 e"),
				spin("1")
			]
		},
		{
			id: "Z",
			kind: "particle",
			name: "Z boson",
			symbol: "Z⁰",
			calcSymbol: "m_Z",
			calcValue: "1.625572e-25 kg",
			aliases: [
				"z boson",
				"z",
				"z particle",
				"z0",
				"neutral weak boson"
			],
			summary: "Neutral mediator of the weak interaction.",
			properties: [
				{
					label: "Mass (energy)",
					display: "91.1879 GeV",
					numeric: 91.1879,
					unit: "GeV",
					source: pdg("S044")
				},
				{
					label: "Decay width",
					display: "2.4955 GeV",
					numeric: 2.4955,
					unit: "GeV",
					source: pdg("S044")
				},
				charge(0, "0"),
				spin("1")
			]
		},
		{
			id: "higgs",
			kind: "particle",
			name: "Higgs boson",
			symbol: "H",
			aliases: [
				"higgs",
				"higgs boson",
				"h",
				"god particle",
				"scalar boson"
			],
			summary: "Scalar boson of the Brout–Englert–Higgs mechanism (gives mass to elementary particles).",
			properties: [
				{
					label: "Mass (energy)",
					display: "125.13 GeV",
					numeric: 125.13,
					unit: "GeV",
					source: pdg("S126")
				},
				charge(0, "0"),
				spin("0")
			]
		},
		{
			id: "up",
			kind: "particle",
			name: "Up quark",
			symbol: "u",
			aliases: [
				"up quark",
				"up",
				"u quark"
			],
			summary: "First-generation up-type quark.",
			properties: [
				{
					label: "Mass (energy)",
					display: "2.16 MeV",
					numeric: 2.16,
					unit: "MeV",
					source: pdg("Q002")
				},
				charge(2 / 3, "+2/3 e"),
				spin("1/2")
			]
		},
		{
			id: "down",
			kind: "particle",
			name: "Down quark",
			symbol: "d",
			aliases: [
				"down quark",
				"down",
				"d quark"
			],
			summary: "First-generation down-type quark.",
			properties: [
				{
					label: "Mass (energy)",
					display: "4.70 MeV",
					numeric: 4.7,
					unit: "MeV",
					source: pdg("Q001")
				},
				charge(-1 / 3, "−1/3 e"),
				spin("1/2")
			]
		},
		{
			id: "strange",
			kind: "particle",
			name: "Strange quark",
			symbol: "s",
			aliases: [
				"strange quark",
				"strange",
				"s quark"
			],
			summary: "Second-generation down-type quark.",
			properties: [
				{
					label: "Mass (energy)",
					display: "92.9 MeV",
					numeric: 92.9,
					unit: "MeV",
					source: pdg("Q003")
				},
				charge(-1 / 3, "−1/3 e"),
				spin("1/2")
			]
		},
		{
			id: "charm",
			kind: "particle",
			name: "Charm quark",
			symbol: "c",
			aliases: [
				"charm quark",
				"charm",
				"c quark"
			],
			summary: "Second-generation up-type quark (MS-bar mass).",
			properties: [
				{
					label: "Mass (energy)",
					display: "1.2729 GeV",
					numeric: 1.2729,
					unit: "GeV",
					source: pdg("Q004")
				},
				charge(2 / 3, "+2/3 e"),
				spin("1/2")
			]
		},
		{
			id: "bottom",
			kind: "particle",
			name: "Bottom quark",
			symbol: "b",
			aliases: [
				"bottom quark",
				"bottom",
				"b quark",
				"beauty quark"
			],
			summary: "Third-generation down-type quark (MS-bar mass).",
			properties: [
				{
					label: "Mass (energy)",
					display: "4.1859 GeV",
					numeric: 4.1859,
					unit: "GeV",
					source: pdg("Q005")
				},
				charge(-1 / 3, "−1/3 e"),
				spin("1/2")
			]
		},
		{
			id: "top",
			kind: "particle",
			name: "Top quark",
			symbol: "t",
			aliases: [
				"top quark",
				"top",
				"t quark",
				"truth quark"
			],
			summary: "Third-generation up-type quark; the heaviest known elementary particle.",
			properties: [
				{
					label: "Mass (energy)",
					display: "172.60 GeV",
					numeric: 172.6,
					unit: "GeV",
					source: pdg("Q007")
				},
				charge(2 / 3, "+2/3 e"),
				spin("1/2")
			]
		}
	];

//#endregion
//#region src/engine/lookup.ts
	const PARTICLE_CONSTS = /* @__PURE__ */ new Set([
		"m_e",
		"m_p",
		"m_n",
		"m_W",
		"m_Z"
	]);
	function buildConstantEntities() {
		const byName = /* @__PURE__ */ new Map();
		for (const c of CONSTANTS) {
			if (PARTICLE_CONSTS.has(c.symbol)) continue;
			const f = formatSI(new Quantity(c.value, c.dim));
			const existing = byName.get(c.name);
			if (existing) {
				existing.aliases.push(c.symbol);
				continue;
			}
			byName.set(c.name, {
				id: `const:${c.symbol}`,
				kind: "constant",
				name: c.name,
				symbol: c.symbol,
				calcSymbol: c.symbol,
				calcValue: f.display,
				aliases: [c.symbol, c.name],
				properties: [{
					label: "Value (SI)",
					display: f.display,
					numeric: f.value,
					unit: f.unit,
					source: c.source
				}]
			});
		}
		return [...byName.values()];
	}
	const ENTITIES = [...PARTICLES, ...buildConstantEntities()];
	const STOP = /* @__PURE__ */ new Set([
		"the",
		"a",
		"an",
		"of",
		"particle",
		"boson",
		"lepton",
		"quark",
		"meson",
		"baryon",
		"constant",
		"mass"
	]);
	function norm(s) {
		return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
	}
	function tokens(s) {
		return norm(s).split(" ").filter((t) => t && !STOP.has(t));
	}
	/** Levenshtein edit distance. */
	function lev(a, b) {
		const m = a.length;
		const n = b.length;
		if (!m) return n;
		if (!n) return m;
		let prev = Array.from({ length: n + 1 }, (_, i) => i);
		let cur = new Array(n + 1);
		for (let i = 1; i <= m; i++) {
			cur[0] = i;
			for (let j = 1; j <= n; j++) {
				const cost = a[i - 1] === b[j - 1] ? 0 : 1;
				cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
			}
			[prev, cur] = [cur, prev];
		}
		return prev[n];
	}
	function scoreStr(query, target) {
		const nq = norm(query);
		const nt = norm(target);
		if (!nq || !nt) return 0;
		if (nq === nt) return 1e3;
		if (nt.startsWith(nq)) return 850;
		if (nt.includes(nq)) return 700;
		if (nt.length >= 3 && nq.includes(nt)) return 650;
		const qt = tokens(query);
		const tt = tokens(target);
		let tokenScore = 0;
		if (qt.length && tt.length) {
			let hits = 0;
			for (const a of qt) for (const b of tt) {
				if (a === b) {
					hits += 1;
					break;
				}
				if (b.startsWith(a) || a.startsWith(b)) {
					hits += .8;
					break;
				}
				const d = lev(a, b);
				if (Math.max(a.length, b.length) > 0 && d / Math.max(a.length, b.length) <= .34) {
					hits += .6;
					break;
				}
			}
			tokenScore = hits / qt.length * 600;
		}
		const d = lev(nq, nt);
		const m = Math.max(nq.length, nt.length);
		const fuzzy = m > 0 ? Math.max(0, 1 - d / m) * 520 : 0;
		return Math.max(tokenScore, fuzzy);
	}
	function scoreEntity(query, e) {
		let best = 0;
		for (const t of [
			e.name,
			...e.aliases,
			e.symbol ?? "",
			e.calcSymbol ?? ""
		]) if (t) best = Math.max(best, scoreStr(query, t));
		return best;
	}
	/** Rank entities by fuzzy relevance to the query (best first). */
	function searchEntities(query, limit = 6) {
		const q = query.trim();
		if (!q) return [];
		return ENTITIES.map((entity) => ({
			entity,
			score: scoreEntity(q, entity)
		})).filter((r) => r.score >= 320).sort((a, b) => b.score - a.score).slice(0, limit);
	}

//#endregion
//#region src/engine/latex.ts
	const FUNC_TEX = {
		sin: "\\sin",
		cos: "\\cos",
		tan: "\\tan",
		asin: "\\arcsin",
		acos: "\\arccos",
		atan: "\\arctan",
		arcsin: "\\arcsin",
		arccos: "\\arccos",
		arctan: "\\arctan",
		sinh: "\\sinh",
		cosh: "\\cosh",
		tanh: "\\tanh",
		ln: "\\ln",
		log: "\\log",
		exp: "\\exp"
	};
	const SPECIAL = {
		pi: "\\pi",
		hbar: "\\hbar",
		mu0: "\\mu_0",
		eps0: "\\varepsilon_0",
		sigma: "\\sigma"
	};
	function baseTex(s) {
		return SPECIAL[s] ?? (s.length > 1 ? `\\mathrm{${s}}` : s);
	}
	function identTex(name) {
		if (SPECIAL[name]) return SPECIAL[name];
		const i = name.indexOf("_");
		if (i >= 0) {
			const b = name.slice(0, i);
			const sub = name.slice(i + 1);
			return `${baseTex(b)}_{${sub.length > 1 ? `\\mathrm{${sub}}` : sub}}`;
		}
		return baseTex(name);
	}
	function numTex(v) {
		if (Number.isInteger(v)) return String(v);
		const s = String(v);
		if (s.includes("e")) {
			const [m, e] = s.split("e");
			return `${m}\\times10^{${Number(e)}}`;
		}
		return s;
	}
	function wrap(r, min) {
		return r.prec < min ? `\\left(${r.tex}\\right)` : r.tex;
	}
	function rec(n) {
		switch (n.kind) {
			case "num": return {
				tex: numTex(n.value),
				prec: 5
			};
			case "ident": return {
				tex: identTex(n.name),
				prec: 5
			};
			case "unary": return {
				tex: `${n.op}${wrap(rec(n.arg), 3)}`,
				prec: 3
			};
			case "pow": return {
				tex: `${wrap(rec(n.base), 4)}^{${rec(n.exp).tex}}`,
				prec: 4
			};
			case "binary": {
				if (n.op === "/") return {
					tex: `\\frac{${rec(n.left).tex}}{${rec(n.right).tex}}`,
					prec: 2
				};
				if (n.op === "*") return {
					tex: `${wrap(rec(n.left), 2)}\\cdot ${wrap(rec(n.right), 2)}`,
					prec: 2
				};
				const l = wrap(rec(n.left), 1);
				const r = wrap(rec(n.right), n.op === "-" ? 2 : 1);
				return {
					tex: `${l} ${n.op} ${r}`,
					prec: 1
				};
			}
			case "call":
				if (n.name === "sqrt") return {
					tex: `\\sqrt{${rec(n.arg).tex}}`,
					prec: 5
				};
				if (n.name === "abs") return {
					tex: `\\left|${rec(n.arg).tex}\\right|`,
					prec: 5
				};
				return {
					tex: `${FUNC_TEX[n.name] ?? `\\operatorname{${n.name}}`}\\!\\left(${rec(n.arg).tex}\\right)`,
					prec: 5
				};
			case "convert": return {
				tex: `${rec(n.expr).tex}\\;\\rightarrow\\;${rec(n.target).tex}`,
				prec: 0
			};
		}
	}
	/** LaTeX for the parsed input, or null if it cannot be parsed. */
	function exprToLatex(input) {
		const t = input.trim();
		if (!t) return null;
		try {
			return rec(parse(t)).tex;
		} catch {
			return null;
		}
	}

//#endregion
//#region src/engine/index.ts
/** SI value + unit label for a constant/unit definition, e.g. "1.602177e-19 C". */
	function siLabel(d) {
		return formatSI(new Quantity(d.value, d.dim)).display;
	}
	/** Parse, evaluate, and format an expression in the chosen unit system. */
	function calculate(input, system) {
		const trimmed = input.trim();
		if (!trimmed) return {
			ok: false,
			empty: true
		};
		try {
			const node = parse(trimmed);
			if (node.kind === "convert") {
				const expr = evaluate(node.expr);
				const conv = convert(expr, evaluate(node.target), system);
				if (!conv.ok) return {
					ok: false,
					error: conv.reason
				};
				return {
					ok: true,
					isConversion: true,
					value: conv.ratio,
					unit: node.targetText,
					display: `${fmtNum(conv.ratio)} ${node.targetText}`,
					dimension: expr.dim.toString()
				};
			}
			const q = evaluate(node);
			const f = system === "natural" ? formatNatural(q) : formatSI(q);
			return {
				ok: true,
				value: f.value,
				unit: f.unit,
				display: f.display,
				dimension: q.dim.toString(),
				natural: system === "natural" ? toNatural(q) : void 0
			};
		} catch (err) {
			return {
				ok: false,
				error: err instanceof Error ? err.message : String(err)
			};
		}
	}
	function collectIdents(node, out) {
		switch (node.kind) {
			case "ident":
				out.add(node.name);
				break;
			case "unary":
				collectIdents(node.arg, out);
				break;
			case "binary":
				collectIdents(node.left, out);
				collectIdents(node.right, out);
				break;
			case "pow":
				collectIdents(node.base, out);
				collectIdents(node.exp, out);
				break;
			case "call":
				collectIdents(node.arg, out);
				break;
			case "convert":
				collectIdents(node.expr, out);
				collectIdents(node.target, out);
				break;
		}
	}
	/** List the cited constants and units referenced by an expression, with their
	*  SI values and source links — so every parameter value is traceable. */
	function symbolsUsed(input) {
		const trimmed = input.trim();
		if (!trimmed) return {
			constants: [],
			units: []
		};
		let node;
		try {
			node = parse(trimmed);
		} catch {
			return {
				constants: [],
				units: []
			};
		}
		const names = /* @__PURE__ */ new Set();
		collectIdents(node, names);
		const constants = [];
		const units = [];
		const seen = /* @__PURE__ */ new Set();
		for (const name of names) {
			const info = describeSymbol(name);
			if (!info) continue;
			const key = `${info.kind}:${info.def.symbol}`;
			if (seen.has(key)) continue;
			seen.add(key);
			const item = {
				symbol: info.def.symbol,
				name: info.def.name,
				siValue: formatSI(new Quantity(info.def.value, info.def.dim)).display,
				source: info.def.source
			};
			if (info.kind === "constant") constants.push(item);
			else units.push(item);
		}
		return {
			constants,
			units
		};
	}

//#endregion
exports.CONSTANTS = CONSTANTS;
exports.UNITS = UNITS;
exports.UNIT_SYSTEMS = UNIT_SYSTEMS;
exports.calculate = calculate;
exports.exprToLatex = exprToLatex;
exports.fmtNum = fmtNum;
exports.searchEntities = searchEntities;
exports.siLabel = siLabel;
exports.symbolsUsed = symbolsUsed;
return exports;
})({});