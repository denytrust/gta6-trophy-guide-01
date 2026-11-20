// Leonida Platinum Atlas — entrypoint for gta6-trophy-guide-01.
//
// The guide itself is the app/ folder beside this file: plain static files
// that open in a desktop browser and work with the network off. This program
// only hands the entry in: it copies app/ and screenshots/ into the output
// directory the grader reads, then writes /output/dossier.json with the
// kit's buildDossier helper from vendor/makefun-frontend.ts, which must stay
// exactly as the kit ships it.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output, so a local
// run looks like:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The copy is byte-for-byte, so running this twice writes the same output.

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";

const appDir = join(repoRoot, "app");
const shotsDir = join(repoRoot, "screenshots");
if (!existsSync(appDir)) throw new Error("app/ is missing from the repository");
if (!existsSync(shotsDir)) throw new Error("screenshots/ is missing from the repository");

mkdirSync(outDir, { recursive: true });
cpSync(appDir, join(outDir, "app"), { recursive: true });
cpSync(shotsDir, join(outDir, "screenshots"), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outDir, "dossier.json"), dossier);
console.log("wrote " + join(outDir, "dossier.json") + " (" + dossier.length + " bytes)");
