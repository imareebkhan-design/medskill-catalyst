import "server-only";
import { db } from "@/src/lib/db";
import { ContentStatus } from "@/src/generated/prisma/enums";
import type { FacultyInput } from "./faculty-schema";

/**
 * Faculty service layer.
 *
 * Same shape as the success-stories service: every read and write goes through
 * here, and a write, its expertise rows, its version snapshot and its activity
 * entry all share ONE transaction. Expertise is replaced wholesale rather than
 * diffed — the list is short, and a delete-then-insert inside a transaction is
 * far easier to reason about than a partial reconciliation.
 *
 * CMS-side only. The public read path (Phase 8) lives in src/lib/site-content.ts
 * and never imports from here.
 */

export const FACULTY_ENTITY = "faculty";

export type FacultyListItem = {
  id: string;
  fullName: string;
  designation: string;
  organization: string | null;
  profileImageUrl: string | null;
  experienceDisplay: string | null;
  status: ContentStatus;
  displayOrder: number;
  expertise: string[];
  updatedAt: Date;
};

export type FacultyDetail = FacultyListItem & {
  yearsExperience: number | null;
  shortBio: string | null;
  fullBio: string | null;
  publishedAt: Date | null;
  archivedAt: Date | null;
};

export type ReadResult<T> =
  | { status: "ok"; data: T }
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

const NOT_DELETED = { deleted_at: null } as const;

const EXPERTISE_SELECT = {
  orderBy: { display_order: "asc" },
  select: { expertise_name: true },
} as const;

// ── Reads ────────────────────────────────────────────────────────────

export async function listFaculty(): Promise<ReadResult<FacultyListItem[]>> {
  try {
    const rows = await db.faculty.findMany({
      where: NOT_DELETED,
      orderBy: [{ display_order: "asc" }, { created_at: "asc" }],
      select: {
        id: true,
        full_name: true,
        designation: true,
        organization: true,
        profile_image_url: true,
        experience_display: true,
        status: true,
        display_order: true,
        updated_at: true,
        expertise: EXPERTISE_SELECT,
      },
    });
    return {
      status: "ok",
      data: rows.map((r) => ({
        id: r.id,
        fullName: r.full_name,
        designation: r.designation,
        organization: r.organization,
        profileImageUrl: r.profile_image_url,
        experienceDisplay: r.experience_display,
        status: r.status,
        displayOrder: r.display_order,
        expertise: r.expertise.map((e) => e.expertise_name),
        updatedAt: r.updated_at,
      })),
    };
  } catch (err) {
    if (isMissingTable(err)) return { status: "not-provisioned" };
    console.error("[cms] failed to list faculty:", err);
    return { status: "unavailable" };
  }
}

export async function getFaculty(id: string): Promise<ReadResult<FacultyDetail | null>> {
  try {
    const r = await db.faculty.findFirst({
      where: { id, ...NOT_DELETED },
      include: { expertise: EXPERTISE_SELECT },
    });
    if (!r) return { status: "ok", data: null };
    return {
      status: "ok",
      data: {
        id: r.id,
        fullName: r.full_name,
        designation: r.designation,
        organization: r.organization,
        profileImageUrl: r.profile_image_url,
        yearsExperience: r.years_experience,
        experienceDisplay: r.experience_display,
        shortBio: r.short_bio,
        fullBio: r.full_bio,
        status: r.status,
        displayOrder: r.display_order,
        expertise: r.expertise.map((e) => e.expertise_name),
        updatedAt: r.updated_at,
        publishedAt: r.published_at,
        archivedAt: r.archived_at,
      },
    };
  } catch (err) {
    if (isMissingTable(err)) return { status: "not-provisioned" };
    console.error("[cms] failed to read a faculty member:", err);
    return { status: "unavailable" };
  }
}

// ── Writes ───────────────────────────────────────────────────────────

export type WriteOutcome =
  | { ok: true; id: string; changedFields: string[] }
  | { ok: false; reason: "not-provisioned" | "unavailable" | "not-found" };

function snapshot(input: FacultyInput, status: ContentStatus, order: number) {
  return {
    full_name: input.full_name,
    designation: input.designation,
    organization: input.organization ?? null,
    profile_image_url: input.profile_image_url ?? null,
    years_experience: input.years_experience ?? null,
    experience_display: input.experience_display ?? null,
    short_bio: input.short_bio ?? null,
    full_bio: input.full_bio ?? null,
    // Joined so a reordering or renaming of tags registers as a change.
    expertise: input.expertise.join(" | "),
    status,
    display_order: order,
  };
}

type Snap = ReturnType<typeof snapshot>;

function diffFields(before: Snap | null, after: Snap): string[] {
  if (!before) return Object.keys(after);
  return (Object.keys(after) as (keyof Snap)[]).filter((k) => before[k] !== after[k]);
}

async function recordChange(
  tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
  opts: {
    id: string;
    action: string;
    entityName: string;
    actorId: string;
    before: Snap | null;
    after: Snap;
    changedFields: string[];
  },
) {
  const latest = await tx.contentVersion.findFirst({
    where: { entity_type: FACULTY_ENTITY, entity_id: opts.id },
    orderBy: { version_number: "desc" },
    select: { version_number: true },
  });

  await tx.contentVersion.create({
    data: {
      entity_type: FACULTY_ENTITY,
      entity_id: opts.id,
      version_number: (latest?.version_number ?? 0) + 1,
      content_data: opts.after,
      created_by_id: opts.actorId,
    },
  });

  await tx.auditLog.create({
    data: {
      cms_user_id: opts.actorId,
      action: opts.action,
      entity_type: FACULTY_ENTITY,
      entity_id: opts.id,
      entity_name: opts.entityName,
      before: opts.before ?? undefined,
      after: { ...opts.after, changed_fields: opts.changedFields },
    },
  });
}

function toData(input: FacultyInput) {
  return {
    full_name: input.full_name,
    designation: input.designation,
    organization: input.organization ?? null,
    profile_image_url: input.profile_image_url ?? null,
    years_experience: input.years_experience ?? null,
    experience_display: input.experience_display ?? null,
    short_bio: input.short_bio ?? null,
    full_bio: input.full_bio ?? null,
  };
}

/**
 * Replace a member's expertise tags. Deleting first keeps display_order dense
 * and avoids reconciling two lists; the cascade on faculty_id means orphans
 * are impossible either way.
 */
async function replaceExpertise(
  tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
  facultyId: string,
  names: string[],
) {
  await tx.facultyExpertise.deleteMany({ where: { faculty_id: facultyId } });
  if (names.length === 0) return;
  await tx.facultyExpertise.createMany({
    data: names.map((expertise_name, i) => ({
      faculty_id: facultyId,
      expertise_name,
      display_order: i + 1,
    })),
  });
}

/** Create a faculty member. Always starts as a DRAFT. */
export async function createFaculty(
  input: FacultyInput,
  actorId: string,
): Promise<WriteOutcome> {
  try {
    return await db.$transaction(async (tx) => {
      const last = await tx.faculty.findFirst({
        where: { deleted_at: null },
        orderBy: { display_order: "desc" },
        select: { display_order: true },
      });
      const order = (last?.display_order ?? 0) + 1;

      const row = await tx.faculty.create({
        data: {
          ...toData(input),
          status: ContentStatus.DRAFT,
          display_order: order,
          created_by_id: actorId,
          updated_by_id: actorId,
        },
        select: { id: true },
      });

      await replaceExpertise(tx, row.id, input.expertise);

      const after = snapshot(input, ContentStatus.DRAFT, order);
      await recordChange(tx, {
        id: row.id,
        action: "faculty.created",
        entityName: input.full_name,
        actorId,
        before: null,
        after,
        changedFields: Object.keys(after),
      });

      return { ok: true as const, id: row.id, changedFields: Object.keys(after) };
    });
  } catch (err) {
    if (isMissingTable(err)) return { ok: false, reason: "not-provisioned" };
    console.error("[cms] failed to create a faculty member:", err);
    return { ok: false, reason: "unavailable" };
  }
}

/** Update content and expertise. Does not change status. */
export async function updateFaculty(
  id: string,
  input: FacultyInput,
  actorId: string,
): Promise<WriteOutcome> {
  try {
    return await db.$transaction(async (tx) => {
      const existing = await tx.faculty.findFirst({
        where: { id, deleted_at: null },
        include: { expertise: EXPERTISE_SELECT },
      });
      if (!existing) return { ok: false as const, reason: "not-found" as const };

      const before: Snap = {
        full_name: existing.full_name,
        designation: existing.designation,
        organization: existing.organization,
        profile_image_url: existing.profile_image_url,
        years_experience: existing.years_experience,
        experience_display: existing.experience_display,
        short_bio: existing.short_bio,
        full_bio: existing.full_bio,
        expertise: existing.expertise.map((e) => e.expertise_name).join(" | "),
        status: existing.status,
        display_order: existing.display_order,
      };

      const after = snapshot(input, existing.status, existing.display_order);
      const changedFields = diffFields(before, after);

      await tx.faculty.update({
        where: { id },
        data: { ...toData(input), updated_by_id: actorId },
      });

      // Only rewrite tags when they actually changed — a delete+insert on every
      // save would churn rows and reset ids for no reason.
      if (changedFields.includes("expertise")) {
        await replaceExpertise(tx, id, input.expertise);
      }

      if (changedFields.length === 0) {
        return { ok: true as const, id, changedFields };
      }

      await recordChange(tx, {
        id,
        action: "faculty.updated",
        entityName: input.full_name,
        actorId,
        before,
        after,
        changedFields,
      });

      return { ok: true as const, id, changedFields };
    });
  } catch (err) {
    if (isMissingTable(err)) return { ok: false, reason: "not-provisioned" };
    console.error("[cms] failed to update a faculty member:", err);
    return { ok: false, reason: "unavailable" };
  }
}

export type StatusChange = "publish" | "unpublish" | "archive" | "restore";

const STATUS_FOR: Record<StatusChange, ContentStatus> = {
  publish: ContentStatus.PUBLISHED,
  unpublish: ContentStatus.DRAFT,
  archive: ContentStatus.ARCHIVED,
  restore: ContentStatus.DRAFT,
};

const ACTION_FOR: Record<StatusChange, string> = {
  publish: "faculty.published",
  unpublish: "faculty.unpublished",
  archive: "faculty.archived",
  restore: "faculty.restored",
};

export async function changeFacultyStatus(
  id: string,
  change: StatusChange,
  actorId: string,
): Promise<WriteOutcome> {
  try {
    return await db.$transaction(async (tx) => {
      const existing = await tx.faculty.findFirst({
        where: { id, deleted_at: null },
        include: { expertise: EXPERTISE_SELECT },
      });
      if (!existing) return { ok: false as const, reason: "not-found" as const };

      const nextStatus = STATUS_FOR[change];
      if (existing.status === nextStatus) {
        return { ok: true as const, id, changedFields: [] };
      }

      await tx.faculty.update({
        where: { id },
        data: {
          status: nextStatus,
          updated_by_id: actorId,
          // Records FIRST publication; not cleared on unpublish.
          published_at:
            change === "publish"
              ? (existing.published_at ?? new Date())
              : existing.published_at,
          archived_at: change === "archive" ? new Date() : null,
        },
      });

      const base = {
        full_name: existing.full_name,
        designation: existing.designation,
        organization: existing.organization,
        profile_image_url: existing.profile_image_url,
        years_experience: existing.years_experience,
        experience_display: existing.experience_display,
        short_bio: existing.short_bio,
        full_bio: existing.full_bio,
        expertise: existing.expertise.map((e) => e.expertise_name).join(" | "),
        display_order: existing.display_order,
      };

      await recordChange(tx, {
        id,
        action: ACTION_FOR[change],
        entityName: existing.full_name,
        actorId,
        before: { ...base, status: existing.status },
        after: { ...base, status: nextStatus },
        changedFields: ["status"],
      });

      return { ok: true as const, id, changedFields: ["status"] };
    });
  } catch (err) {
    if (isMissingTable(err)) return { ok: false, reason: "not-provisioned" };
    console.error("[cms] failed to change a faculty member's status:", err);
    return { ok: false, reason: "unavailable" };
  }
}

/**
 * Reorder the faculty list. Positions are rewritten from the supplied
 * sequence, so the result is always a dense 1..n.
 */
export async function reorderFaculty(
  orderedIds: string[],
  actorId: string,
): Promise<WriteOutcome> {
  try {
    return await db.$transaction(async (tx) => {
      const rows = await tx.faculty.findMany({
        where: { deleted_at: null },
        select: { id: true },
      });
      const known = new Set(rows.map((r) => r.id));
      const ids = orderedIds.filter((id) => known.has(id));

      for (const [index, id] of ids.entries()) {
        await tx.faculty.update({
          where: { id },
          data: { display_order: index + 1, updated_by_id: actorId },
        });
      }

      await tx.auditLog.create({
        data: {
          cms_user_id: actorId,
          action: "faculty.reordered",
          entity_type: FACULTY_ENTITY,
          entity_id: "faculty-order",
          entity_name: "Faculty order",
          after: { order: ids },
        },
      });

      return { ok: true as const, id: "faculty-order", changedFields: ["display_order"] };
    });
  } catch (err) {
    if (isMissingTable(err)) return { ok: false, reason: "not-provisioned" };
    console.error("[cms] failed to reorder faculty:", err);
    return { ok: false, reason: "unavailable" };
  }
}

/** Version history for one member, newest first. */
export async function getFacultyVersions(id: string, take = 20) {
  try {
    return await db.contentVersion.findMany({
      where: { entity_type: FACULTY_ENTITY, entity_id: id },
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
