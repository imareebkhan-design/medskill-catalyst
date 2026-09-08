/**
 * Build-time gate: refuse to build if the homepage template has lost a sentinel.
 *
 *   npx tsx scripts/check-homepage-sentinels.ts
 *
 * Runs as part of `npm run build`. A missing sentinel is safe at runtime — the
 * fallback renders — but silent: content would be published in the CMS and
 * never appear. Failing the build makes that impossible to ship unnoticed.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { exit } from "node:process";
import { validateTemplate } from "../src/lib/homepage-sentinels";

const TEMPLATE = join(process.cwd(), "public", "index.html");

let template: string;
try {
  template = readFileSync(TEMPLATE, "utf8");
} catch {
  console.error(`✗ Cannot read the homepage template at ${TEMPLATE}`);
  exit(1);
}

const problems = validateTemplate(template);

if (problems.length > 0) {
  console.error("\n✗ public/index.html is missing CMS sentinels:\n");
  for (const p of problems) {
    console.error(
      `    ${p.key} (${p.syntax}): ${p.problem} — ${p.starts} start / ${p.ends} end`,
    );
  }
  console.error(
    "\n  Those homepage regions would silently keep their hardcoded content,\n" +
      "  and CMS changes would never appear. Restore the markers before building.\n",
  );
  exit(1);
}

console.log(`✓ homepage sentinels intact (${problems.length === 0 ? "all present and balanced" : ""})`);
