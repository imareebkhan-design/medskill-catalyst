import "server-only";
import { db } from "@/src/lib/db";
import { AdmissionsStatus } from "@/src/generated/prisma/enums";
import type { CohortSettingsInput } from "./cohort-schema";
import { dateOnlyToUtc, utcToDateOnly } from "./cohort-dates";

// Re-exported so callers have one import site for cohort concerns.
export { dateOnlyToUtc, utcToDateOnly };

/**
 * Cohort Settings service layer.
 *
 * All cohort reads and writes go through here — page components never touch
 * Prisma directly. A write, its version snapshot and its activity entry happen
 * inside ONE transaction, so history can never end up out of step with the
 * record it describes.
 */

export const COHORT_ENTITY = "cohort_setting";

export type Cohort = {
  id: string;
  cohortName: string;
  /** Canonical date-only value, at UTC midnight. */
  startDate: Date;
  /** Canonical "HH:mm", or null. */
  startTime: string | null;
  admissionsStatus: AdmissionsStatus;
  duration: string | null;
  registrationUrl: string | null;
  updatedAt: Date;
  updatedByName: string | null;
};

export type CohortReadResult =
  | { status: "ok"; cohort: Cohort | null }
  | { status: "not-provisioned" }
  | { status: "unavailable" };

function isMissingTable(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "P2021"
  );
}

// ── Reads ────────────────────────────────────────────────────────────

/** The single active cohort, or null when none has been set up yet. */
export async function getActiveCohort(): Promise<CohortReadResult> {
  try {
    const row = await db.cohortSetting.findFirst({
      where: { is_active: true },
      include: { updated_by: { select: { full_name: true } } },
    });
    if (!row) return { status: "ok", cohort: null };

    return {
      status: "ok",
      cohort: {
        id: row.id,
        cohortName: row.cohort_name,
        startDate: row.start_date,
        startTime: row.start_time,
        admissionsStatus: row.admissions_status,
        duration: row.duration,
        registrationUrl: row.registration_url,
        updatedAt: row.updated_at,
        updatedByName: row.updated_by?.full_name ?? null,
      },
    };
  } catch (err) {
    if (isMissingTable(err)) return { status: "not-provisioned" };
    console.error("[cms] failed to read cohort settings:", err);
    return { status: "unavailable" };
  }
}

// ── Writes ───────────────────────────────────────────────────────────

export type SaveOutcome =
  | { ok: true; created: boolean; changedFields: string[] }
  | { ok: false; reason: "not-provisioned" | "unavailable" };

/** Snapshot shape stored in ContentVersion.content_data. */
function snapshot(input: CohortSettingsInput) {
  return {
    cohort_name: input.cohort_name,
    start_date: input.start_date,
    start_time: input.start_time ?? null,
    admissions_status: input.admissions_status,
    duration: input.duration ?? null,
    registration_url: input.registration_url ?? null,
  };
}

/** Which fields actually changed, for the activity entry. */
function diffFields(
  before: ReturnType<typeof snapshot> | null,
  after: ReturnType<typeof snapshot>,
): string[] {
  if (!before) return Object.keys(after);
  return (Object.keys(after) as (keyof typeof after)[]).filter(
    (key) => before[key] !== after[key],
  );
}

/**
 * Create or update the active cohort.
 *
 * Input MUST already have passed cohortSettingsSchema on the server — this
 * function trusts its argument and does not re-validate shape.
 */
export async function saveCohort(
  input: CohortSettingsInput,
  actorId: string,
): Promise<SaveOutcome> {
  try {
    return await db.$transaction(async (tx) => {
      const existing = await tx.cohortSetting.findFirst({ where: { is_active: true } });

      const before = existing
        ? {
            cohort_name: existing.cohort_name,
            start_date: utcToDateOnly(existing.start_date),
            start_time: existing.start_time,
            admissions_status: existing.admissions_status,
            duration: existing.duration,
            registration_url: existing.registration_url,
          }
        : null;

      const after = snapshot(input);
      const changedFields = diffFields(before, after);

      const data = {
        cohort_name: input.cohort_name,
        start_date: dateOnlyToUtc(input.start_date),
        start_time: input.start_time ?? null,
        admissions_status: input.admissions_status as AdmissionsStatus,
        duration: input.duration ?? null,
        registration_url: input.registration_url ?? null,
        updated_by_id: actorId,
      };

      const row = existing
        ? await tx.cohortSetting.update({ where: { id: existing.id }, data })
        : await tx.cohortSetting.create({ data: { ...data, is_active: true } });

      // Nothing changed — don't manufacture a version or an activity entry.
      if (existing && changedFields.length === 0) {
        return { ok: true as const, created: false, changedFields };
      }

      // Append-only history: the next version number, never a rewrite.
      const latest = await tx.contentVersion.findFirst({
        where: { entity_type: COHORT_ENTITY, entity_id: row.id },
        orderBy: { version_number: "desc" },
        select: { version_number: true },
      });

      await tx.contentVersion.create({
        data: {
          entity_type: COHORT_ENTITY,
          entity_id: row.id,
          version_number: (latest?.version_number ?? 0) + 1,
          content_data: after,
          created_by_id: actorId,
        },
      });

      await tx.auditLog.create({
        data: {
          cms_user_id: actorId,
          action: existing ? "cohort_setting.updated" : "cohort_setting.created",
          entity_type: COHORT_ENTITY,
          entity_id: row.id,
          entity_name: input.cohort_name,
          // Only cohort content is recorded here — no credentials or secrets
          // pass through this module.
          before: before ?? undefined,
          after: { ...after, changed_fields: changedFields },
        },
      });

      return { ok: true as const, created: !existing, changedFields };
    });
  } catch (err) {
    if (isMissingTable(err)) return { ok: false, reason: "not-provisioned" };
    console.error("[cms] failed to save cohort settings:", err);
    return { ok: false, reason: "unavailable" };
  }
}

/** Version history for the active cohort, newest first. */
export async function getCohortVersions(cohortId: string, take = 10) {
  try {
    return await db.contentVersion.findMany({
      where: { entity_type: COHORT_ENTITY, entity_id: cohortId },
      orderBy: { version_number: "desc" },
      take,
      select: {
        id: true,
        version_number: true,
        created_at: true,
        created_by: { select: { full_name: true } },
      },
    });
  } catch {
    return [];
  }
}
