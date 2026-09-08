/**
 * Sentinel injection for the static homepage.
 *
 * Pure and dependency-free so it can be unit-tested without a database, a
 * server, or Next. `homepage-content.ts` supplies the CMS values; this file
 * only knows how to swap text between two explicit markers.
 *
 * Deliberately NOT a regular expression over the HTML. It does an indexOf for
 * a literal opening marker, an indexOf for the literal closing marker after
 * it, and replaces what lies between. No pattern can drift onto unrelated
 * content, and unbalanced or missing markers are left exactly as they are.
 *
 * The safety contract, in order of importance:
 *
 *   1. A missing sentinel is not an error. The document is returned unchanged
 *      for that key, so the original hand-written markup renders.
 *   2. An unbalanced sentinel (start without end, or end before start) is
 *      skipped, not guessed at.
 *   3. A null/empty replacement means "keep the fallback" — never "render
 *      nothing". An empty CMS can never blank a section.
 *   4. Every occurrence of a key is replaced, because the same value appears
 *      in several places on the page.
 */

/** Where a sentinel lives, which decides its comment syntax. */
export type SentinelSyntax = "html" | "js";

export function startMarker(key: string, syntax: SentinelSyntax = "html"): string {
  return syntax === "js" ? `/* cms:${key}:start */` : `<!-- cms:${key}:start -->`;
}

export function endMarker(key: string, syntax: SentinelSyntax = "html"): string {
  return syntax === "js" ? `/* cms:${key}:end */` : `<!-- cms:${key}:end -->`;
}

/**
 * The sentinels the homepage template is required to contain.
 *
 * Single source of truth, shared by the injector, the build-time check and the
 * test suite — so a key can never be added in one place and forgotten in
 * another. A missing sentinel degrades safely at runtime, but silently: content
 * would be published in the CMS and simply never appear. This manifest turns
 * that silent failure into a loud one.
 */
export const HOMEPAGE_SENTINELS: { key: string; syntax: SentinelSyntax }[] = [
  { key: "cohort.date.long", syntax: "html" },
  { key: "cohort.date.long", syntax: "js" },
  { key: "cohort.date.short", syntax: "html" },
  { key: "cohort.date.us", syntax: "html" },
  { key: "cohort.date.compact", syntax: "html" },
  { key: "stories.track1", syntax: "html" },
  { key: "stories.track2", syntax: "html" },
  { key: "faculty.cards", syntax: "html" },
];

export type TemplateProblem = {
  key: string;
  syntax: SentinelSyntax;
  problem: "missing" | "unbalanced";
  starts: number;
  ends: number;
};

/**
 * Check a homepage template for every required sentinel.
 *
 * Returns the problems found rather than throwing, so callers decide whether
 * that means a failed test, a failed build, or a warning.
 */
export function validateTemplate(template: string): TemplateProblem[] {
  const problems: TemplateProblem[] = [];

  for (const { key, syntax } of HOMEPAGE_SENTINELS) {
    const open = startMarker(key, syntax);
    const close = endMarker(key, syntax);
    const starts = template.split(open).length - 1;
    const ends = template.split(close).length - 1;

    if (starts === 0 && ends === 0) {
      problems.push({ key, syntax, problem: "missing", starts, ends });
    } else if (starts !== ends) {
      problems.push({ key, syntax, problem: "unbalanced", starts, ends });
    }
  }

  return problems;
}

export type InjectionResult = {
  html: string;
  /** Keys that were found and replaced at least once. */
  replaced: string[];
  /** Keys that had no sentinel in the document — fallback rendered. */
  missing: string[];
  /** Keys whose markers were unbalanced — fallback rendered. */
  malformed: string[];
  /** Keys skipped because the CMS supplied no value — fallback rendered. */
  skipped: string[];
};

export type Replacement = {
  key: string;
  syntax?: SentinelSyntax;
  /**
   * The content to place between the markers. `null` or an empty string means
   * "leave the existing content alone" — this is how the fallback works.
   */
  value: string | null;
};

/**
 * Replace the content between each sentinel pair.
 *
 * The markers themselves are preserved, so injection is repeatable: the same
 * document can be re-injected with new values on the next request, and the
 * fallback markup is only ever displaced in the response, never in the file.
 */
export function injectSentinels(
  template: string,
  replacements: Replacement[],
): InjectionResult {
  let html = template;
  const replaced: string[] = [];
  const missing: string[] = [];
  const malformed: string[] = [];
  const skipped: string[] = [];

  for (const { key, syntax = "html", value } of replacements) {
    const open = startMarker(key, syntax);
    const close = endMarker(key, syntax);

    if (!html.includes(open) || !html.includes(close)) {
      missing.push(key);
      continue;
    }

    // No value from the CMS: leave the fallback in place. This is the single
    // most important branch in the file — it is what stops an empty database
    // from blanking a section of the homepage.
    if (value === null || value === "") {
      skipped.push(key);
      continue;
    }

    let searchFrom = 0;
    let didReplace = false;
    let wasMalformed = false;
    let out = "";

    while (true) {
      const startAt = html.indexOf(open, searchFrom);
      if (startAt === -1) break;

      const contentStart = startAt + open.length;
      const contentEnd = html.indexOf(close, contentStart);
      if (contentEnd === -1) {
        // An opening marker with no closing marker after it. Stop rather than
        // swallow the rest of the document.
        wasMalformed = true;
        break;
      }

      out += html.slice(searchFrom, contentStart) + value;
      searchFrom = contentEnd;
      didReplace = true;
    }

    if (wasMalformed) {
      malformed.push(key);
      continue; // `out` is discarded; the document stays as it was.
    }

    if (didReplace) {
      html = out + html.slice(searchFrom);
      replaced.push(key);
    } else {
      missing.push(key);
    }
  }

  return { html, replaced, missing, malformed, skipped };
}

/** Escape text destined for HTML so CMS content can never inject markup. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Escape text destined for a single-quoted JavaScript string literal.
 *
 * The homepage's FAQ data is a JS array, so a value going in there needs
 * JS escaping, not HTML escaping. Closing the script tag early is also
 * prevented.
 */
export function escapeJsString(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\r?\n/g, " ")
    .replace(/<\/script/gi, "<\\/script");
}
