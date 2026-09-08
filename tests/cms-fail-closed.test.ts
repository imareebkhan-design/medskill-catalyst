import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Architecture guard for a security invariant.
 *
 * Exactly ONE place in the CMS auth stack is allowed to fail open: the
 * rate-limit check, which returns false (allow) if its query errors, because
 * failing closed there would turn a brief database hiccup into a total CMS
 * lockout.
 *
 * Everywhere else an error must DENY. Two shapes of that are acceptable:
 *
 *   - propagate (role checks, capability checks, the page guards), or
 *   - catch and return the unauthenticated/false value (session resolution,
 *     credential verification).
 *
 * What is never acceptable is a catch that yields a user, a session, or true.
 *
 * These tests read the source rather than the runtime because the dangerous
 * change is textual: someone later editing a catch in getCmsUser() to return
 * a session instead of null. That would silently convert authentication to
 * fail-open, and nothing else would catch it.
 */

const root = join(import.meta.dirname, "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

/**
 * Strip comments before analysing control flow. Without this, prose in a
 * comment ("it must not return a user") is indistinguishable from code and
 * makes these checks lie in either direction.
 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

/** Extract a top-level function body by name, brace-matched. */
function functionBody(source: string, name: string): string {
  const start = source.indexOf(`function ${name}`);
  assert.notEqual(start, -1, `expected to find function ${name}`);
  const open = source.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  throw new Error(`unbalanced braces in ${name}`);
}

test("session resolution denies on error and never grants access", () => {
  // getCmsUser catches deliberately, so a deployment whose CMS tables do not
  // exist yet redirects to sign-in instead of returning 500 on every route.
  // The invariant is not "never catch" — it is "every catch DENIES".
  const body = stripComments(functionBody(read("src/lib/cms-auth.ts"), "getCmsUser"));
  const afterCatch = body.split("catch").slice(1);

  assert.ok(afterCatch.length > 0, "getCmsUser is expected to catch lookup failures");

  for (const chunk of afterCatch) {
    const firstReturn = chunk.indexOf("return");
    assert.notEqual(firstReturn, -1, "every catch in getCmsUser must return");
    assert.match(
      chunk.slice(firstReturn, firstReturn + 24),
      /return null/,
      "a catch in getCmsUser must return null (deny). Returning a session " +
        "object here would silently convert authentication to fail-OPEN.",
    );
  }
});

test("session resolution has no path that fabricates a user", () => {
  const body = stripComments(functionBody(read("src/lib/cms-auth.ts"), "getCmsUser"));
  // The only object literal this function may return is built from the row it
  // read back. A hardcoded role or id would be a bypass.
  assert.ok(
    !/role:\s*["'`]/.test(body),
    "getCmsUser must never hardcode a role",
  );
  assert.ok(
    !/CmsRole\.[A-Z_]+/.test(body),
    "getCmsUser must not reference a concrete role — it returns what it read",
  );
});

test("the throwing guards never swallow errors", () => {
  const source = read("src/lib/cms-auth.ts");
  for (const fn of ["requireCmsUser", "requireCapability"]) {
    assert.ok(!stripComments(functionBody(source, fn)).includes("catch"), `${fn} must not catch`);
  }
});

test("the redirecting page guards never swallow errors", () => {
  const source = read("src/lib/cms-guard.ts");
  assert.ok(
    !source.includes("catch"),
    "cms-guard.ts must contain no try/catch: a swallowed error there would " +
      "let an unauthenticated request fall through to a page.",
  );
});

test("credential verification denies on malformed input", () => {
  // verifyPassword catches, but every catch returns false (deny), never true.
  const body = stripComments(functionBody(read("src/lib/password.ts"), "verifyPassword"));
  const afterCatch = body.split("catch").slice(1);
  assert.ok(afterCatch.length > 0, "verifyPassword is expected to catch");
  for (const chunk of afterCatch) {
    const firstReturn = chunk.indexOf("return");
    assert.notEqual(firstReturn, -1, "each catch must return");
    assert.match(
      chunk.slice(firstReturn, firstReturn + 20),
      /return false/,
      "every catch in verifyPassword must deny, never allow",
    );
  }
});

test("the rate-limit check is the only deliberate fail-open", () => {
  const body = stripComments(functionBody(read("src/lib/cms-rate-limit.ts"), "isLoginThrottled"));
  assert.ok(body.includes("catch"), "isLoginThrottled is expected to catch");
  assert.ok(
    body.includes("return false"),
    "isLoginThrottled must fail open (allow the attempt) so a database " +
      "hiccup cannot lock the whole CMS out",
  );
});

test("a failed login attempt cannot issue a session", () => {
  const source = read("src/app/cms/actions.ts");
  // The catch around attemptLogin must return an error state, not fall through
  // to the redirect that follows a success.
  const catchIndex = source.indexOf("catch");
  const slice = source.slice(catchIndex, catchIndex + 500);
  assert.ok(slice.includes("return"), "the login catch must return early");
  assert.ok(
    !slice.slice(0, slice.indexOf("return")).includes("createSession"),
    "no session may be created on the failure path",
  );
});

test("the throttle message derives its wait time from the configured window", () => {
  const source = read("src/lib/cms-auth.ts");
  assert.ok(
    source.includes("${LOGIN_LIMITS.windowMinutes}"),
    "the wait shown to users must come from LOGIN_LIMITS, not a second " +
      "hardcoded number that could drift from the real window",
  );
});
