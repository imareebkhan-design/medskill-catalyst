import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { db, deps, issueInput, key, program, staff, storage } from "../helpers";
import {
  issueCredential,
  planIssue,
  issueInputSchema,
  reissueCredential,
  resendCredential,
  retryCredential,
  revokeCredential,
} from "@/src/modules/credentials/service";
import { CredentialError } from "@/src/modules/credentials/errors";
import { toPublicCredential, PUBLIC_SELECT } from "@/src/modules/credentials/public";
import type { CredentialStorage } from "@/src/modules/credentials/storage";

const env = { ...process.env };
afterEach(() => {
  process.env = { ...env };
});

let P: Awaited<ReturnType<typeof program>>;
let issuer: Awaited<ReturnType<typeof staff>>;
let admin: Awaited<ReturnType<typeof staff>>;

beforeAll(async () => {
  P = await program({ code: "FND" });
  issuer = await staff("ISSUER");
  admin = await staff("ADMIN");
});

async function events(credentialId: string) {
  return (await db.credentialEvent.findMany({ where: { credential_id: credentialId }, orderBy: { created_at: "asc" } })).map((e) => e.type);
}

describe("single issuance", () => {
  it("issues exactly once with unique ID, token, stored PDF and audit trail", async () => {
    const input = issueInput(P);
    const r = await issueCredential(input, issuer, deps());
    const c = r.credential;
    expect(r.created).toBe(true);
    expect(c.status).toBe("VALID");
    expect(c.certificate_id).toMatch(/^MSC-20\d\d-FND-[23456789A-Z]{6}$/);
    expect(c.verification_token).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(c.created_by_id).toBe(issuer.id);

    const bytes = await storage.get(c.pdf_path!);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(c.pdf_sha256);
    expect(c.pdf_path).toContain(c.pdf_sha256!);

    expect(await events(c.id)).toEqual(["ISSUE_REQUESTED", "PDF_GENERATED", "ISSUED", "EMAIL_SUPPRESSED"]);
    expect(r.email?.status).toBe("SUPPRESSED"); // CREDENTIAL_EMAIL_MODE=off in tests

    const student = await db.student.findUniqueOrThrow({ where: { id: c.student_id } });
    expect(student.email).toBe(input.email);
  });

  it("is idempotent: retries with the same key return the same credential", async () => {
    const input = issueInput(P);
    const a = await issueCredential(input, issuer, deps());
    const b = await issueCredential(input, issuer, deps());
    expect(b.created).toBe(false);
    expect(b.credential.id).toBe(a.credential.id);
    expect(await db.credential.count({ where: { idempotency_key: input.idempotencyKey } })).toBe(1);
  });

  it("is idempotent under concurrent double-submits", async () => {
    const input = issueInput(P);
    const results = await Promise.allSettled(Array.from({ length: 6 }, () => issueCredential(input, issuer, deps())));
    const ok = results.filter((r) => r.status === "fulfilled") as PromiseFulfilledResult<Awaited<ReturnType<typeof issueCredential>>>[];
    expect(ok.length).toBeGreaterThan(0);
    expect(new Set(ok.map((r) => r.value.credential.id)).size).toBe(1);
    expect(await db.credential.count({ where: { idempotency_key: input.idempotencyKey } })).toBe(1);
    // Any rejected ones only say "in progress", never a second credential.
    for (const r of results) if (r.status === "rejected") expect((r.reason as CredentialError).code).toBe("IN_PROGRESS");
  });

  it("rejects reusing a key for different data", async () => {
    const input = issueInput(P);
    await issueCredential(input, issuer, deps());
    await expect(issueCredential({ ...input, email: "someone-else@example.test" }, issuer, deps())).rejects.toMatchObject({ code: "CONFLICT" });
  });
});

describe("duplicate rule: learner + program + cohort", () => {
  it("blocks a second active credential for the same cohort, with the existing ID", async () => {
    const input = issueInput(P);
    const first = await issueCredential(input, issuer, deps());
    const err = await issueCredential({ ...input, idempotencyKey: key() }, issuer, deps()).catch((e) => e);
    expect(err).toBeInstanceOf(CredentialError);
    expect(err.code).toBe("DUPLICATE");
    expect(err.details.certificateId).toBe(first.credential.certificate_id);
  });

  it("matches the learner by email case-insensitively", async () => {
    const input = issueInput(P);
    await issueCredential(input, issuer, deps());
    const err = await issueCredential({ ...input, email: input.email.toUpperCase(), idempotencyKey: key() }, issuer, deps()).catch((e) => e);
    expect(err.code).toBe("DUPLICATE");
  });

  it("allows the same learner in a different cohort", async () => {
    const input = issueInput(P);
    await issueCredential(input, issuer, deps());
    const other = await issueCredential({ ...input, batchId: P.batch2.id, idempotencyKey: key() }, issuer, deps());
    expect(other.credential.status).toBe("VALID");
  });

  it("without a cohort, uses the completion date as the completion context", async () => {
    const input = issueInput({ course: P.course, batch: null });
    await issueCredential(input, issuer, deps());
    await expect(issueCredential({ ...input, idempotencyKey: key() }, issuer, deps())).rejects.toMatchObject({ code: "DUPLICATE" });
    const later = await issueCredential({ ...input, completionDate: "2026-08-20", idempotencyKey: key() }, issuer, deps());
    expect(later.credential.status).toBe("VALID");
  });

  it("holds under concurrency: parallel different keys produce exactly one credential", async () => {
    const input = issueInput(P);
    const results = await Promise.allSettled(Array.from({ length: 5 }, () => issueCredential({ ...input, idempotencyKey: key() }, issuer, deps())));
    const student = await db.student.findFirstOrThrow({ where: { email: input.email } });
    const live = await db.credential.count({ where: { student_id: student.id, course_id: P.course.id, status: { in: ["VALID", "ISSUING"] } } });
    expect(live).toBe(1);
    expect(results.filter((r) => r.status === "fulfilled").length).toBe(1);
  });
});

describe("validation before anything is written", () => {
  it("rejects future dates, unknown cohorts, missing template, missing program code and unfit names", async () => {
    const before = await db.credential.count();
    await expect(issueCredential(issueInput(P, { completionDate: "2099-01-01" }), issuer, deps())).rejects.toMatchObject({ code: "VALIDATION" });
    const other = await program();
    await expect(issueCredential(issueInput(P, { batchId: other.batch.id }), issuer, deps())).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(issueCredential(issueInput(P, { fullName: "Supercalifragilisticexpialidocious".repeat(3) }), issuer, deps())).rejects.toMatchObject({ code: "RENDER" });
    const noCode = await db.course.create({ data: { name: "No code", slug: `nc-${key()}`, base_price_paise: 1 } });
    await expect(issueCredential(issueInput({ course: noCode, batch: null }), issuer, deps())).rejects.toMatchObject({ code: "CONFIG" });
    expect(await db.credential.count()).toBe(before);
  });

  it("warns when the email belongs to a learner with a different name", async () => {
    const input = issueInput(P);
    await issueCredential(input, issuer, deps());
    const plan = await planIssue(issueInputSchema.parse({ ...input, fullName: "P. Raman", batchId: P.batch2.id, idempotencyKey: key() }), deps());
    expect(plan.warnings.join(" ")).toMatch(/existing learner named "Priya Raman"/);
  });

  it("refuses the development template on production", async () => {
    process.env.VERCEL_ENV = "production";
    await expect(issueCredential(issueInput(P), issuer, deps())).rejects.toMatchObject({ code: "CONFIG" });
  });
});

describe("failure handling", () => {
  it("a storage failure leaves a hidden FAILED credential, no email, and retry completes it", async () => {
    let fail = true;
    const flaky: CredentialStorage = {
      put: async (k, b, t) => {
        if (fail) throw new Error("storage down");
        return storage.put(k, b, t);
      },
      get: (k) => storage.get(k),
    };
    const r = await issueCredential(issueInput(P), issuer, deps({ storage: flaky }));
    expect(r.credential.status).toBe("FAILED");
    expect(r.email).toBeNull();
    expect(toPublicCredential(r.credential)).toBeNull(); // not publicly verifiable
    expect(await db.credentialEmailDelivery.count({ where: { credential_id: r.credential.id } })).toBe(0);

    fail = false;
    const retried = await retryCredential(r.credential.id, issuer, deps({ storage: flaky }));
    expect(retried.status).toBe("VALID");
    expect(await events(r.credential.id)).toEqual(["ISSUE_REQUESTED", "RENDER_FAILED", "PDF_GENERATED", "ISSUED", "EMAIL_SUPPRESSED"]);
  });

  it("an email failure keeps the credential VALID, records the failure, and resend works", async () => {
    process.env.CREDENTIAL_EMAIL_MODE = "redirect";
    process.env.CREDENTIAL_EMAIL_REDIRECT_TO = "qa@medskillscatalyst.test";
    const failing = deps({ mailer: async () => ({ ok: false, reason: "resend_500: boom" }) });
    const r = await issueCredential(issueInput(P), issuer, failing);
    expect(r.credential.status).toBe("VALID");
    expect(r.email?.status).toBe("FAILED");
    const delivery = await db.credentialEmailDelivery.findFirstOrThrow({ where: { credential_id: r.credential.id } });
    expect(delivery).toMatchObject({ status: "FAILED", recipient: "qa@medskillscatalyst.test", attempts: 1 });
    expect(await events(r.credential.id)).toContain("EMAIL_FAILED");

    const sent: string[] = [];
    const ok = deps({ mailer: async (m) => (sent.push(m.to), { ok: true, id: "m1" }) });
    const resent = await resendCredential(r.credential.id, issuer, ok);
    expect(resent.status).toBe("SENT");
    expect(sent).toEqual(["qa@medskillscatalyst.test"]); // redirect mode never reaches the learner
    expect(await db.credential.count({ where: { student_id: r.credential.student_id, course_id: P.course.id } })).toBe(1); // no new credential
  });

  it("throttles resends", async () => {
    const r = await issueCredential(issueInput(P), issuer, deps());
    for (let i = 0; i < 5; i++) await resendCredential(r.credential.id, issuer, deps());
    await expect(resendCredential(r.credential.id, issuer, deps())).rejects.toMatchObject({ code: "RATE_LIMITED" });
  });
});

describe("revoke", () => {
  it("revokes a VALID credential, keeps the record, hides the reason publicly", async () => {
    const r = await issueCredential(issueInput(P), issuer, deps());
    const revoked = await revokeCredential(r.credential.id, "Issued in error — wrong cohort", admin, deps());
    expect(revoked).toMatchObject({ status: "REVOKED", revoked_by_id: admin.id, revocation_reason: "Issued in error — wrong cohort" });
    const pub = toPublicCredential(await db.credential.findUniqueOrThrow({ where: { id: r.credential.id }, select: PUBLIC_SELECT }))!;
    expect(pub.status).toBe("REVOKED");
    expect(JSON.stringify(pub)).not.toContain("wrong cohort");
    expect(await events(r.credential.id)).toContain("REVOKED");
    await expect(revokeCredential(r.credential.id, "again please", admin, deps())).rejects.toMatchObject({ code: "NOT_ALLOWED" });
    await expect(revokeCredential(r.credential.id, "x", admin, deps())).rejects.toThrow();
  });

  it("frees the duplicate rule so a corrected credential can be issued", async () => {
    const input = issueInput(P);
    const r = await issueCredential(input, issuer, deps());
    await revokeCredential(r.credential.id, "Wrong name spelling", admin, deps());
    const again = await issueCredential({ ...input, idempotencyKey: key() }, issuer, deps());
    expect(again.credential.status).toBe("VALID");
  });
});

describe("reissue", () => {
  it("creates a linked replacement and supersedes the original atomically", async () => {
    const r = await issueCredential(issueInput(P), issuer, deps());
    const re = await reissueCredential(r.credential.id, { fullName: "Priya S. Raman", reason: "Name correction requested", idempotencyKey: key() }, admin, deps());
    const child = re.credential;
    expect(child.status).toBe("VALID");
    expect(child.supersedes_id).toBe(r.credential.id);
    expect(child.certificate_id).not.toBe(r.credential.certificate_id);
    expect(child.verification_token).not.toBe(r.credential.verification_token);
    expect(child.learner_name).toBe("Priya S. Raman");
    expect(child.source).toBe("REISSUE");

    const parent = await db.credential.findUniqueOrThrow({ where: { id: r.credential.id } });
    expect(parent.status).toBe("SUPERSEDED");
    expect(toPublicCredential(parent)!.status).toBe("SUPERSEDED"); // old page still resolves
    expect(await events(parent.id)).toContain("SUPERSEDED");
    expect(await events(child.id)).toEqual(expect.arrayContaining(["REISSUED", "ISSUED"]));

    await expect(reissueCredential(r.credential.id, { reason: "second attempt", idempotencyKey: key() }, admin, deps())).rejects.toMatchObject({ code: "NOT_ALLOWED" });
  });

  it("reissuing a revoked credential leaves the original REVOKED", async () => {
    const r = await issueCredential(issueInput(P), issuer, deps());
    await revokeCredential(r.credential.id, "Revoked for correction", admin, deps());
    const re = await reissueCredential(r.credential.id, { reason: "Corrected completion date", completionDate: "2026-07-20", idempotencyKey: key() }, admin, deps());
    expect(re.credential.status).toBe("VALID");
    expect((await db.credential.findUniqueOrThrow({ where: { id: r.credential.id } })).status).toBe("REVOKED");
    await expect(reissueCredential(r.credential.id, { reason: "yet another", idempotencyKey: key() }, admin, deps())).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("is idempotent", async () => {
    const r = await issueCredential(issueInput(P), issuer, deps());
    const k = key();
    const a = await reissueCredential(r.credential.id, { reason: "Name correction", idempotencyKey: k }, admin, deps());
    const b = await reissueCredential(r.credential.id, { reason: "Name correction", idempotencyKey: k }, admin, deps());
    expect(b.credential.id).toBe(a.credential.id);
    expect(b.created).toBe(false);
  });
});

describe("expiry", () => {
  it("computes expires_at from program validity and derives EXPIRED at read time", async () => {
    const Q = await program({ validityMonths: 12 });
    const r = await issueCredential(issueInput(Q, { completionDate: "2024-01-10" }), issuer, deps());
    expect(r.credential.expires_at?.toISOString().slice(0, 10)).toBe("2025-01-10");
    expect(toPublicCredential(r.credential)!.status).toBe("EXPIRED");
    expect(r.credential.status).toBe("VALID"); // stored status unchanged; no job needed
  });
});
