import { describe, expect, it } from "vitest";
import {
  generateCertificateId,
  generateVerificationToken,
  isWellFormedCertificateId,
  isWellFormedToken,
  normalizeCertificateId,
  randomSuffix,
} from "@/src/modules/credentials/identifiers";
import { CERTIFICATE_ID_FORMAT } from "@/src/modules/credentials/config";
import { computeExpiresAt, derivePublicStatus } from "@/src/modules/credentials/status";
import { addMonths, parseISODate } from "@/src/modules/credentials/dates";
import { dedupeKey } from "@/src/modules/credentials/dedupe";

const d = (s: string) => new Date(`${s}T00:00:00.000Z`);

describe("certificate IDs", () => {
  it("match MSC-{YEAR}-{PROGRAM}-{RANDOM}", () => {
    const id = generateCertificateId({ programCode: "FND", year: 2026 });
    expect(id).toMatch(/^MSC-2026-FND-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{6}$/);
    expect(isWellFormedCertificateId(id)).toBe(true);
  });

  it("never contain look-alike characters", () => {
    const all = Array.from({ length: 5000 }, () => randomSuffix()).join("");
    expect(all).not.toMatch(/[01ILOU]/);
    expect(new Set(all).size).toBe(CERTIFICATE_ID_FORMAT.alphabet.length); // uniform coverage
  });

  it("are not sequential and are unique across a large sample", () => {
    const ids = Array.from({ length: 50_000 }, () => generateCertificateId({ programCode: "FND", year: 2026 }));
    expect(new Set(ids).size).toBeGreaterThan(49_990); // 30^6 space: collisions are rare and caught by the DB
  });

  it("rejects invalid program codes", () => {
    expect(() => generateCertificateId({ programCode: "fnd", year: 2026 })).toThrow();
    expect(() => generateCertificateId({ programCode: "F", year: 2026 })).toThrow();
  });

  it("normalizes what people type", () => {
    expect(normalizeCertificateId("  msc-2026-fnd-7k4p92 ")).toBe("MSC-2026-FND-7K4P92");
    expect(normalizeCertificateId("MSC–2026—FND‑7K4P92")).toBe("MSC-2026-FND-7K4P92");
    expect(normalizeCertificateId("MSC - 2026 - FND - 7K4P92")).toBe("MSC-2026-FND-7K4P92");
    expect(isWellFormedCertificateId(normalizeCertificateId("x' OR 1=1 --"))).toBe(false);
    expect(isWellFormedCertificateId("MSC-2026-FND-7K4P9O")).toBe(false); // O is not in the alphabet
  });
});

describe("verification tokens", () => {
  it("are 22-char base64url, 128-bit, unique", () => {
    const tokens = Array.from({ length: 20_000 }, generateVerificationToken);
    for (const t of tokens.slice(0, 200)) expect(isWellFormedToken(t)).toBe(true);
    expect(new Set(tokens).size).toBe(tokens.length);
    expect(Buffer.from(tokens[0], "base64url").length).toBe(16);
  });
  it("reject malformed input", () => {
    expect(isWellFormedToken("../../etc/passwd")).toBe(false);
    expect(isWellFormedToken("short")).toBe(false);
    expect(isWellFormedToken("A".repeat(23))).toBe(false);
  });
});

describe("status derivation", () => {
  const now = new Date("2026-09-25T06:00:00Z");
  it("hides ISSUING and FAILED", () => {
    expect(derivePublicStatus({ status: "ISSUING", expires_at: null }, now)).toBeNull();
    expect(derivePublicStatus({ status: "FAILED", expires_at: null }, now)).toBeNull();
  });
  it("derives EXPIRED at read time", () => {
    expect(derivePublicStatus({ status: "VALID", expires_at: null }, now)).toBe("VALID");
    expect(derivePublicStatus({ status: "VALID", expires_at: d("2026-09-26") }, now)).toBe("VALID");
    expect(derivePublicStatus({ status: "VALID", expires_at: d("2026-09-25") }, now)).toBe("EXPIRED");
    expect(derivePublicStatus({ status: "VALID", expires_at: d("2025-01-01") }, now)).toBe("EXPIRED");
  });
  it("uses the Indian calendar date", () => {
    // 19:00 UTC on the 24th is already the 25th in India.
    expect(derivePublicStatus({ status: "VALID", expires_at: d("2026-09-25") }, new Date("2026-09-24T19:00:00Z"))).toBe("EXPIRED");
    expect(derivePublicStatus({ status: "VALID", expires_at: d("2026-09-25") }, new Date("2026-09-24T18:00:00Z"))).toBe("VALID");
  });
  it("REVOKED and SUPERSEDED win over expiry", () => {
    expect(derivePublicStatus({ status: "REVOKED", expires_at: d("2020-01-01") }, now)).toBe("REVOKED");
    expect(derivePublicStatus({ status: "SUPERSEDED", expires_at: d("2020-01-01") }, now)).toBe("SUPERSEDED");
  });
});

describe("expiry computation", () => {
  it("is lifetime when validity_months is null", () => {
    expect(computeExpiresAt({ validityMonths: null, anchor: "COMPLETION", completionDate: d("2026-01-31"), issueDate: d("2026-02-10") })).toBeNull();
  });
  it("counts from the configured anchor and clamps month ends", () => {
    expect(computeExpiresAt({ validityMonths: 1, anchor: "COMPLETION", completionDate: d("2026-01-31"), issueDate: d("2026-02-10") })?.toISOString().slice(0, 10)).toBe("2026-02-28");
    expect(computeExpiresAt({ validityMonths: 24, anchor: "ISSUE", completionDate: d("2026-01-31"), issueDate: d("2026-02-10") })?.toISOString().slice(0, 10)).toBe("2028-02-10");
    expect(addMonths(d("2028-01-31"), 1).toISOString().slice(0, 10)).toBe("2028-02-29");
  });
  it("rejects impossible dates", () => {
    expect(parseISODate("2026-02-31")).toBeNull();
    expect(parseISODate("26-02-01")).toBeNull();
  });
});

describe("dedupe key", () => {
  it("is learner+program+cohort, or learner+program+completion date without a cohort", () => {
    const base = { studentId: "s1", courseId: "c1", completionDate: d("2026-07-15") };
    expect(dedupeKey({ ...base, batchId: "b1" })).toBe("v1:s1:c1:b:b1");
    expect(dedupeKey({ ...base, batchId: "b1" })).toBe(dedupeKey({ ...base, batchId: "b1", completionDate: d("2026-08-01") }));
    expect(dedupeKey({ ...base, batchId: "b1" })).not.toBe(dedupeKey({ ...base, batchId: "b2" }));
    expect(dedupeKey({ ...base, batchId: null })).toBe("v1:s1:c1:c:2026-07-15");
  });
});
