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
 * lockout. Everywhere else — session resolution, role checks, capability
 * checks — an error must propagate and deny access.
 *
 * These tests read the source rather than the runtime because the dangerous
 * change is textual: someone later wrapping getCmsUser() or a guard in a
 * try/catch that swallows the error and returns a user. That would silently
 * convert authorization to fail-open, and nothing else would catch it.
 */

const root = join(import.meta.dirname, "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

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

test("session resolution never swallows errors", () => {
  const body = functionBody(read("src/lib/cms-auth.ts"), "getCmsUser");
  assert.ok(
    !body.includes("catch"),
    "getCmsUser must let database errors propagate — a caught error that " +
      "returned null would be safe, but one returning a user would not. " +
      "Keep this path free of try/catch.",
  );
});

test("the throwing guards never swallow errors", () => {
  const source = read("src/lib/cms-auth.ts");
  for (const fn of ["requireCmsUser", "requireCapability"]) {
    assert.ok(!functionBody(source, fn).includes("catch"), `${fn} must not catch`);
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
  const body = functionBody(read("src/lib/password.ts"), "verifyPassword");
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
  const body = functionBody(read("src/lib/cms-rate-limit.ts"), "isLoginThrottled");
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
