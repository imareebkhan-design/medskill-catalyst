import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  verifyPassword,
  passwordProblem,
  MIN_PASSWORD_LENGTH,
  equivalentWorkForUnknownUser,
} from "../src/lib/password";

const GOOD = "correct-horse-9-battery";

test("hash/verify round-trips", async () => {
  const hash = await hashPassword(GOOD);
  assert.equal(await verifyPassword(GOOD, hash), true);
});

test("rejects the wrong password", async () => {
  const hash = await hashPassword(GOOD);
  assert.equal(await verifyPassword("wrong-horse-9-battery", hash), false);
  assert.equal(await verifyPassword("", hash), false);
  assert.equal(await verifyPassword(GOOD + " ", hash), false);
});

test("hashes are salted — same password, different hashes", async () => {
  const a = await hashPassword(GOOD);
  const b = await hashPassword(GOOD);
  assert.notEqual(a, b, "two hashes of the same password must differ");
  // ...and both must still verify.
  assert.equal(await verifyPassword(GOOD, a), true);
  assert.equal(await verifyPassword(GOOD, b), true);
});

test("hash is self-describing and carries no plaintext", async () => {
  const hash = await hashPassword(GOOD);
  const parts = hash.split("$");
  assert.equal(parts.length, 6);
  assert.equal(parts[0], "scrypt");
  assert.equal(parts[1], "16384");
  assert.equal(parts[2], "8");
  assert.equal(parts[3], "1");
  assert.ok(!hash.includes(GOOD), "hash must not contain the plaintext");
});

test("malformed hashes return false rather than throwing", async () => {
  for (const bad of [
    "",
    "not-a-hash",
    "scrypt$16384$8$1$onlyfiveparts",
    "bcrypt$16384$8$1$c2FsdA==$aGFzaA==",
    "scrypt$abc$8$1$c2FsdA==$aGFzaA==",
    "scrypt$16384$8$1$$",
  ]) {
    assert.equal(await verifyPassword(GOOD, bad), false, `should reject: ${bad}`);
  }
});

test("refuses absurd cost parameters from a tampered row", async () => {
  // A poisoned N would otherwise let one row exhaust memory on every login.
  const hostile = "scrypt$1048577$8$1$c2FsdHNhbHRzYWx0c2E=$aGFzaGhhc2hoYXNo";
  assert.equal(await verifyPassword(GOOD, hostile), false);
  const hostileR = "scrypt$16384$999$1$c2FsdHNhbHRzYWx0c2E=$aGFzaGhhc2hoYXNo";
  assert.equal(await verifyPassword(GOOD, hostileR), false);
});

test("password policy", () => {
  assert.equal(passwordProblem(GOOD), null);
  assert.ok(passwordProblem("short1"));
  assert.ok(passwordProblem("a".repeat(MIN_PASSWORD_LENGTH)), "needs a digit");
  assert.ok(passwordProblem("1".repeat(MIN_PASSWORD_LENGTH)), "needs a letter");
  assert.ok(passwordProblem("a1" + "x".repeat(250)), "too long");
});

test("unknown-user path performs real work and always returns false", async () => {
  const result = await equivalentWorkForUnknownUser("anything-at-all-1");
  assert.equal(result, false);
});
