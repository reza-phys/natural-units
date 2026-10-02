<p align="center"><img src="assets/favicon.svg" alt="" width="64"></p>

# Natural Units Converter

**Type an expression over numbers, units and physical constants; get the answer in whatever units you ask for.** Exact dimensional analysis, and conversion between SI, natural and Gaussian systems.

```
m_p c^2 in MeV           ->  938.2721 MeV
hbar c in MeV fm         ->  197.327 MeV fm
m_p/m_e                  ->  1836.153

# in natural units (hbar = c = 1), where these conversions have meaning:
1 T in eV^2              ->  195.3528 eV^2
1 GeV^-1 in fm           ->  0.197327 fm
sqrt(hbar c / G) in GeV  ->  1.22089e19 GeV
```

In the spirit of [GUTCalc](https://gutcalc.com/), rewritten with an engine that
carries dimensions as exact rationals rather than floats.

## Run it

No build, no server, no dependencies — it is three files and a page:

```bash
python3 -m http.server 8000      # then open http://localhost:8000
```

Opening `index.html` straight from disk works too.

## What it does

- **Expressions, not form fields.** `m_p c^2 / (2 pi hbar)`, `sqrt(hbar c / G)`, `1 T in eV^2`.
- **Exact dimensions.** Exponents are rational numbers, so `sqrt(m)` has dimension `L^(1/2)` and stays exact through the whole calculation instead of drifting as a float.
- **Three systems.** SI, natural (ħ = c = k_B = ε₀ = 1, Heaviside–Lorentz) and Gaussian. Every conversion factor is derived from the SI defining constants rather than hard-coded.
- **Sourced values.** Constants are CODATA 2022, particle masses are PDG. The result panel cites the value of every parameter it used.
- **Reads-as line.** A live LaTeX rendering of how your input was parsed, so a typo is visible before you trust the number.
- **Lookup.** Search any constant, unit or particle by name or symbol.

## Layout

```
index.html              the page
assets/styles.css       hand-written, no framework
assets/converter.js     UI wiring: input -> NU.calculate -> DOM. Vanilla, no dependencies.
assets/engine.js        GENERATED from src/engine/ — do not edit
src/engine/             the engine's TypeScript source, and its tests
scripts/build-engine.mjs  regenerates assets/engine.js
```

The page loads [KaTeX](https://katex.org/) from a CDN to typeset the reads-as
line and the result. Everything degrades to plain text if it does not arrive;
nothing else is fetched, and no data leaves the browser.

## Working on the engine

npm is needed only to rebuild the bundle or run the tests — never to use the page.

```bash
npm install
npm test            # vitest, over src/engine/engine.test.ts
npm run typecheck
npm run build       # rewrites assets/engine.js
```

Edit `src/engine/`, run `npm run build`, commit the source and the regenerated
bundle together.

## Licence

MIT — see [LICENSE](LICENSE).
