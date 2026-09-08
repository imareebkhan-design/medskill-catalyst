import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isRateLimited,
  clientIpFrom,
  LOGIN_LIMITS,
} from "../src/lib/cms-rate-limit-policy";

const { maxPerIdentifier, maxPerIp } = LOGIN_LIMITS;

test("allows attempts below both thresholds", () => {
  assert.equal(isRateLimited(0, 0), false);
  assert.equal(isRateLimited(maxPerIdentifier - 1, maxPerIp - 1), false);
});

test("throttles once the identifier threshold is reached", () => {
  assert.equal(isRateLimited(maxPerIdentifier, 0), true);
  assert.equal(isRateLimited(maxPerIdentifier + 50, 0), true);
});

test("throttles once the IP threshold is reached, independently", () => {
  assert.equal(isRateLimited(0, maxPerIp), true);
  assert.equal(isRateLimited(0, maxPerIp + 1), true);
});

test("the boundary is inclusive — the Nth failure throttles", () => {
  assert.equal(isRateLimited(maxPerIdentifier - 1, 0), false, "N-1 still allowed");
  assert.equal(isRateLimited(maxPerIdentifier, 0), true, "N is blocked");
});

test("the IP allowance is looser than the identifier allowance", () => {
  // Offices behind NAT share one address; a colleague's typos must not lock
  // everyone out, so this ordering is a deliberate property, not an accident.
  assert.ok(
    maxPerIp > maxPerIdentifier,
    "IP threshold must exceed the per-email threshold",
  );
});

test("extracts the client IP from x-forwarded-for", () => {
  const headers = new Map([["x-forwarded-for", "203.0.113.7, 70.41.3.18, 150.172.238.178"]]);
  assert.equal(clientIpFrom((n) => headers.get(n) ?? null), "203.0.113.7");
});

test("falls back to x-real-ip", () => {
  const headers = new Map([["x-real-ip", "198.51.100.42"]]);
  assert.equal(clientIpFrom((n) => headers.get(n) ?? null), "198.51.100.42");
});

test("returns null when no proxy header is present", () => {
  // Critical: a placeholder here would bucket every visitor under one key,
  // letting a single attacker throttle the entire CMS.
  assert.equal(clientIpFrom(() => null), null);
  assert.equal(clientIpFrom(() => ""), null);
  assert.equal(clientIpFrom(() => "   "), null);
});

test("caps absurdly long header values", () => {
  const long = "1.2.3.4".padEnd(500, "0");
  const ip = clientIpFrom(() => long);
  assert.ok(ip && ip.length <= 64);
});

test("window and retention are coherent", () => {
  assert.ok(LOGIN_LIMITS.windowMinutes > 0);
  assert.ok(
    LOGIN_LIMITS.retentionHours * 60 > LOGIN_LIMITS.windowMinutes,
    "rows must be retained for at least one full counting window",
  );
});
