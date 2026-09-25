import { beforeAll, describe, expect, it } from "vitest";
import { db, deps, issueInput, program, staff } from "../helpers";
import { issueCredential, revokeCredential } from "@/src/modules/credentials/service";
import { activateTemplate, createDevTemplate } from "@/src/modules/credentials/templates";

/**
 * The integrity rules live in the database, so they hold even for code paths
 * that bypass the service (scripts, SQL consoles, future features).
 */
let credId: string;
let P: Awaited<ReturnType<typeof program>>;

beforeAll(async () => {
  P = await program();
  const issuer = await staff("ISSUER");
  credId = (await issueCredential(issueInput(P), issuer, deps())).credential.id;
});

describe("database guards", () => {
  it("credentials cannot be deleted", async () => {
    await expect(db.credential.delete({ where: { id: credId } })).rejects.toThrow(/never deleted/);
    await expect(db.$executeRawUnsafe(`DELETE FROM credentials WHERE id = '${credId}'`)).rejects.toThrow(/never deleted/);
  });

  it("identifiers are immutable", async () => {
    await expect(db.credential.update({ where: { id: credId }, data: { certificate_id: "MSC-2026-XXX-222222" } })).rejects.toThrow(/immutable/);
    await expect(db.credential.update({ where: { id: credId }, data: { verification_token: "A".repeat(22) } })).rejects.toThrow(/immutable/);
  });

  it("printed content is frozen once issued", async () => {
    await expect(db.credential.update({ where: { id: credId }, data: { learner_name: "Someone Else" } })).rejects.toThrow(/reissue instead/);
    await expect(db.credential.update({ where: { id: credId }, data: { pdf_path: "certificates/x/y.pdf" } })).rejects.toThrow(/reissue instead/);
  });

  it("illegal status transitions are refused, and REVOKED is terminal", async () => {
    await expect(db.credential.update({ where: { id: credId }, data: { status: "ISSUING" } })).rejects.toThrow(/illegal credential status/);
    const admin = await staff("ADMIN");
    await revokeCredential(credId, "Terminal state test", admin, deps());
    await expect(db.credential.update({ where: { id: credId }, data: { status: "VALID" } })).rejects.toThrow(/illegal credential status/);
  });

  it("a REVOKED row must record who and when", async () => {
    const issuer = await staff("ISSUER");
    const c = (await issueCredential(issueInput(P), issuer, deps())).credential;
    await expect(db.credential.update({ where: { id: c.id }, data: { status: "REVOKED" } })).rejects.toThrow(/credentials_revoked_has_actor/);
  });

  it("credential_events is append-only", async () => {
    const e = await db.credentialEvent.findFirstOrThrow({ where: { credential_id: credId } });
    await expect(db.credentialEvent.update({ where: { id: e.id }, data: { metadata: {} } })).rejects.toThrow(/append-only/);
    await expect(db.credentialEvent.delete({ where: { id: e.id } })).rejects.toThrow(/append-only/);
    await expect(db.$executeRawUnsafe("TRUNCATE credential_events CASCADE")).rejects.toThrow(/append-only/);
  });

  it("an active template is frozen; only drafts can be deleted; one active per program", async () => {
    await expect(db.certificateTemplate.update({ where: { id: P.template.id }, data: { field_config: {} } })).rejects.toThrow(/immutable/);
    await expect(db.certificateTemplate.delete({ where: { id: P.template.id } })).rejects.toThrow(/only DRAFT/);
    await expect(db.certificateTemplate.update({ where: { id: P.template.id }, data: { status: "DRAFT" } })).rejects.toThrow(/illegal template status/);
    const draft = await createDevTemplate(P.course.id, P.admin, deps());
    await expect(db.certificateTemplate.update({ where: { id: draft.id }, data: { status: "ACTIVE" } })).rejects.toThrow(/one_active_per_course|Unique constraint failed on the fields: \(`course_id`\)/);
    // The supported path retires the old version in the same transaction.
    await activateTemplate(draft.id, P.admin, deps());
    expect((await db.certificateTemplate.findUniqueOrThrow({ where: { id: P.template.id } })).status).toBe("RETIRED");
  });

  it("historic credentials keep the template version that rendered them", async () => {
    const c = await db.credential.findUniqueOrThrow({ where: { id: credId } });
    expect(c.template_id).toBe(P.template.id);
  });

  it("new tables have row level security enabled", async () => {
    const rows = await db.$queryRaw<{ relname: string; relrowsecurity: boolean }[]>`
      SELECT relname, relrowsecurity FROM pg_class
      WHERE relname IN ('credentials','credential_events','credential_email_deliveries','certificate_templates','credential_bulk_jobs','credential_bulk_rows')`;
    expect(rows).toHaveLength(6);
    for (const r of rows) expect(r.relrowsecurity).toBe(true);
  });
});
