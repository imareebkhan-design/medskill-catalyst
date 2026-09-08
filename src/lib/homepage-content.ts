import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  getPublicCohort,
  getPublicFaculty,
  getPublicStories,
} from "@/src/lib/site-content";
import {
  formatCohortDate,
  formatCohortDateShort,
  formatCohortDateUS,
  formatCohortDateCompact,
} from "@/src/lib/cms-format";
import { injectSentinels, type Replacement } from "@/src/lib/homepage-sentinels";
import {
  renderFacultyGrid,
  renderStoryTrack,
  splitIntoTracks,
} from "@/src/lib/homepage-cards";

/**
 * Server-side rendering of the static homepage with CMS content injected.
 *
 *   load template → read published CMS content → inject into sentinels → HTML
 *
 * The template is `public/index.html`, unchanged apart from inert comment
 * markers. Everything between those markers is the original hand-written
 * content, and it is what renders whenever the CMS has nothing to say — an
 * empty database, an unreachable one, or migrations that have not run yet.
 *
 * This module reads CMS data ONLY through src/lib/site-content.ts. It never
 * touches Prisma, so the published-only filtering cannot be bypassed here.
 */

const TEMPLATE_PATH = path.join(process.cwd(), "public", "index.html");

/** Read once per process; the file is ~296 KB and never changes at runtime. */
let templateCache: string | null = null;

async function loadTemplate(): Promise<string | null> {
  if (templateCache !== null) return templateCache;
  try {
    templateCache = await readFile(TEMPLATE_PATH, "utf8");
    return templateCache;
  } catch (err) {
    // Nothing sensible can be served without the template. The route turns
    // this into a 500 rather than an empty page, which is the honest outcome.
    console.error("[homepage] could not read the template:", err);
    return null;
  }
}

/** Exposed for tests; lets a fresh template be picked up between cases. */
export function __resetTemplateCache(): void {
  templateCache = null;
}

/**
 * Build the replacement list for the current CMS state.
 *
 * A null cohort yields nulls throughout, which the injector reads as
 * "keep the fallback" — so no branch here has to remember to do that.
 */
export async function buildReplacements(): Promise<Replacement[]> {
  // One read per content type, all cached behind their own tags.
  const [cohort, stories, faculty] = await Promise.all([
    getPublicCohort(),
    getPublicStories(),
    getPublicFaculty(),
  ]);

  const date = cohort?.startDate ?? null;

  // The homepage shows two marquee rows. Published stories are split in half,
  // preserving display order, which reproduces the current page exactly when
  // all six are published. A null track means "keep that row's fallback", so
  // an empty CMS never empties one row while filling the other.
  const [track1, track2] = splitIntoTracks([
    ...stories.cohortAlumni,
    ...stories.advancedModuleAlumni,
  ]);

  return [
    // The homepage spells the date four different ways. Each location keeps
    // its own spelling; injecting one format everywhere would visibly change
    // the design.
    { key: "cohort.date.long", value: date ? formatCohortDate(date) : null },
    { key: "cohort.date.long", syntax: "js", value: date ? formatCohortDate(date) : null },
    { key: "cohort.date.short", value: date ? formatCohortDateShort(date) : null },
    { key: "cohort.date.us", value: date ? formatCohortDateUS(date) : null },
    { key: "cohort.date.compact", value: date ? formatCohortDateCompact(date) : null },

    { key: "stories.track1", value: renderStoryTrack(track1) },
    { key: "stories.track2", value: renderStoryTrack(track2) },

    { key: "faculty.cards", value: renderFacultyGrid(faculty) },
  ];
}

export type HomepageResult =
  | { ok: true; html: string; replaced: string[]; missing: string[]; skipped: string[] }
  | { ok: false };

/**
 * The homepage, with CMS content injected where available.
 *
 * Never throws. A CMS failure degrades to the original markup; only a missing
 * template is fatal, and that is a deployment problem, not a content one.
 */
export async function renderHomepage(): Promise<HomepageResult> {
  const template = await loadTemplate();
  if (template === null) return { ok: false };

  let replacements: Replacement[];
  try {
    replacements = await buildReplacements();
  } catch (err) {
    // site-content already fails soft, so reaching here means something
    // unexpected. Serve the untouched template rather than an error page.
    console.error("[homepage] CMS read failed; serving the original markup:", err);
    return { ok: true, html: template, replaced: [], missing: [], skipped: [] };
  }

  const result = injectSentinels(template, replacements);

  if (result.missing.length > 0 || result.malformed.length > 0) {
    // Not fatal — those regions rendered their fallback — but it means a
    // sentinel was edited out of the HTML and needs restoring.
    console.warn(
      "[homepage] sentinels not applied:",
      { missing: result.missing, malformed: result.malformed },
    );
  }

  return {
    ok: true,
    html: result.html,
    replaced: result.replaced,
    missing: result.missing,
    skipped: result.skipped,
  };
}
