/* ==========================================================================
   build-engine.mjs — regenerate assets/engine.js from src/engine/.

   The page itself has no build step: index.html loads assets/engine.js as a
   plain script that defines one global, `NU`. This script is how that file is
   produced from the TypeScript source, and is the only reason the repo has an
   npm dependency at all.

     npm install && npm run build

   Edit src/engine/, run this, commit both. Never edit assets/engine.js by hand.
   ========================================================================== */
import { writeFileSync } from "node:fs";
import { rolldown } from "rolldown";

const HEADER = `/* ==========================================================================
   engine.js — the natural-units calculation engine. GENERATED, do not edit.

   Built from src/engine/ by scripts/build-engine.mjs (npm run build).
   Exact rational dimension exponents; SI, natural and Gaussian systems with
   every factor derived from the SI defining constants; CODATA 2022 / PDG
   values; expression parser; LaTeX output. Exposed as the global \`NU\`.
   ========================================================================== */
`;

const bundle = await rolldown({ input: "src/engine/index.ts", platform: "browser" });
const { output } = await bundle.generate({ format: "iife", name: "NU" });
writeFileSync("assets/engine.js", HEADER + output[0].code);
console.log("assets/engine.js regenerated (%d KB)", Math.round(output[0].code.length / 1024));
