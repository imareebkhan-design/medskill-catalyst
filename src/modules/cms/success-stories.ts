import "server-only";
import { db } from "@/src/lib/db";
import { AlumniCategory, ContentStatus } from "@/src/generated/prisma/enums";
import type { SuccessStoryInput } from "./success-story-schema";

/**
 * Success Stories service layer.
 *
 * Every read and write goes through here — page components never touch Prisma
 * directly. A write, its version snapshot and its activity entry share ONE
 * transaction, so history can never drift from the record it describes.
 *
 * This module is CMS-side only. The public read path lives in
 * src/lib/site-content.ts (Phase 8) and never imports from here.
 */

export const STORY_ENTITY = "success_story";

export type StoryListItem = {
  id: string;
  category: AlumniCategory;
  fullName: string;
  profileImageUrl: string | null;
  growthHeadline: string | null;
  previousDesignation: string | null;
  currentDesignation: string | null;
  status: ContentStatus;
  displayOrder: number;
  updatedAt: Date;
};

export type StoryDetail = StoryListItem & {
  linkedinUrl: string | null;
  previousCompany: string | null;
  currentCompany: string | null;
  growthDescription: string | null;
  shortDescription: string | null;
  fullStory: string | null;
  testimonial: string | null;
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

/** Soft-deleted rows are invisible everywhere in the CMS. */
const NOT_DELETED = { deleted_at: null } as const;

// ── Reads ────────────────────────────────────────────────────────────

export async function listStories(): Promise<ReadResult<StoryListItem[]>> {
  try {
    const rows = await db.successStory.findMany({
      where: NOT_DELETED,
      orderBy: [{ category: "asc" }, { display_order: "asc" }, { created_at: "asc" }],
      select: {
        id: true,
        category: true,
        full_name: true,
        profile_image_url: true,
        growth_headline: true,
        previous_designation: true,
        current_designation: true,
        status: true,
        display_order: true,
        updated_at: true,
      },
    });
    return {
      status: "ok",
      data: rows.map((r) => ({
        id: r.id,
        category: r.category,
        fullName: r.full_name,
        profileImageUrl: r.profile_image_url,
        growthHeadline: r.growth_headline,
        previousDesignation: r.previous_designation,
        currentDesignation: r.current_designation,
        status: r.status,
        displayOrder: r.display_order,
        updatedAt: r.updated_at,
      })),
    };
  } catch (err) {
    if (isMissingTable(err)) return { status: "not-provisioned" };
    console.error("[cms] failed to list success stories:", err);
    return { status: "unavailable" };
  }
}

export async function getStory(id: string): Promise<ReadResult<StoryDetail | null>> {
  try {
    const r = await db.successStory.findFirst({ where: { id, ...NOT_DELETED } });
    if (!r) return { status: "ok", data: null };
    return {
      status: "ok",
      data: {
        id: r.id,
        category: r.category,
        fullName: r.full_name,
        profileImageUrl: r.profile_image_url,
        linkedinUrl: r.linkedin_url,
        previousDesignation: r.previous_designation,
        previousCompany: r.previous_company,
        currentDesignation: r.current_designation,
        currentCompany: r.current_company,
        growthHeadline: r.growth_headline,
        growthDescription: r.growth_description,
        shortDescription: r.short_description,
        fullStory: r.full_story,
        testimonial: r.testimonial,
        status: r.status,
        displayOrder: r.display_order,
        updatedAt: r.updated_at,
        publishedAt: r.published_at,
        archivedAt: r.archived_at,
      },
    };
  } catch (err) {
    if (isMissingTable(err)) return { status: "not-provisioned" };
    console.error("[cms] failed to read a success story:", err);
    return { status: "unavailable" };
  }
}

// ── Writes ───────────────────────────────────────────────────────────

export type WriteOutcome =
  | { ok: true; id: string; changedFields: string[] }
  | { ok: false; reason: "not-provisioned" | "unavailable" | "not-found" };

/** The snapshot stored in ContentVersion.content_data. */
function snapshot(input: SuccessStoryInput, status: ContentStatus, order: number) {
  return {
    category: input.category,
    full_name: input.full_name,
    profile_image_url: input.profile_image_url ?? null,
    linkedin_url: input.linkedin_url ?? null,
    previous_designation: input.previous_designation ?? null,
    previous_company: input.previous_company ?? null,
    current_designation: input.current_designation ?? null,
    current_company: input.current_company ?? null,
    growth_headline: input.growth_headline ?? null,
    growth_description: input.growth_description ?? null,
    short_description: input.short_description ?? null,
    full_story: input.full_story ?? null,
    testimonial: input.testimonial ?? null,
    status,
    display_order: order,
  };
}

type Snap = ReturnType<typeof snapshot>;

function diffFields(before: Snap | null, after: Snap): string[] {
  if (!before) return Object.keys(after);
  return (Object.keys(after) as (keyof Snap)[]).filter((k) => before[k] !== after[k]);
}

/**
 * Append a version and an audit entry. Always called INSIDE a transaction so
 * the snapshot and the row it describes commit together or not at all.
 */
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
    where: { entity_type: STORY_ENTITY, entity_id: opts.id },
    orderBy: { version_number: "desc" },
    select: { version_number: true },
  });

  await tx.contentVersion.create({
    data: {
      entity_type: STORY_ENTITY,
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
      entity_type: STORY_ENTITY,
      entity_id: opts.id,
      entity_name: opts.entityName,
      before: opts.before ?? undefined,
      after: { ...opts.after, changed_fields: opts.changedFields },
    },
  });
}

function toData(input: SuccessStoryInput) {
  return {
    category: input.category as AlumniCategory,
    full_name: input.full_name,
    profile_image_url: input.profile_image_url ?? null,
    linkedin_url: input.linkedin_url ?? null,
    previous_designation: input.previous_designation ?? null,
    previous_company: input.previous_company ?? null,
    current_designation: input.current_designation ?? null,
    current_company: input.current_company ?? null,
    growth_headline: input.growth_headline ?? null,
    growth_description: input.growth_description ?? null,
    short_description: input.short_description ?? null,
    full_story: input.full_story ?? null,
    testimonial: input.testimonial ?? null,
  };
}

/** Create a new story. Always starts as a DRAFT — publishing is a separate act. */
export async function createStory(
  input: SuccessStoryInput,
  actorId: string,
): Promise<WriteOutcome> {
  try {
    return await db.$transaction(async (tx) => {
      // Next position within this category only; ordering is per-category.
      const last = await tx.successStory.findFirst({
        where: { category: input.category as AlumniCategory, deleted_at: null },
        orderBy: { display_order: "desc" },
        select: { display_order: true },
      });
      const order = (last?.display_order ?? 0) + 1;

      const row = await tx.successStory.create({
        data: {
          ...toData(input),
          status: ContentStatus.DRAFT,
          display_order: order,
          created_by_id: actorId,
          updated_by_id: actorId,
        },
        select: { id: true },
      });

      const after = snapshot(input, ContentStatus.DRAFT, order);
      await recordChange(tx, {
        id: row.id,
        action: "success_story.created",
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
    console.error("[cms] failed to create a success story:", err);
    return { ok: false, reason: "unavailable" };
  }
}

/** Update an existing story's content. Does not change its status. */
export async function updateStory(
  id: string,
  input: SuccessStoryInput,
  actorId: string,
): Promise<WriteOutcome> {
  try {
    return await db.$transaction(async (tx) => {
      const existing = await tx.successStory.findFirst({ where: { id, deleted_at: null } });
      if (!existing) return { ok: false as const, reason: "not-found" as const };

      const before: Snap = {
        category: existing.category,
        full_name: existing.full_name,
        profile_image_url: existing.profile_image_url,
        linkedin_url: existing.linkedin_url,
        previous_designation: existing.previous_designation,
        previous_company: existing.previous_company,
        current_designation: existing.current_designation,
        current_company: existing.current_company,
        growth_headline: existing.growth_headline,
        growth_description: existing.growth_description,
        short_description: existing.short_description,
        full_story: existing.full_story,
        testimonial: existing.testimonial,
        status: existing.status,
        display_order: existing.display_order,
      };

      const after = snapshot(input, existing.status, existing.display_order);
      const changedFields = diffFields(before, after);

      await tx.successStory.update({
        where: { id },
        data: { ...toData(input), updated_by_id: actorId },
      });

      // A save that changes nothing writes no version and no activity entry.
      if (changedFields.length === 0) {
        return { ok: true as const, id, changedFields };
      }

      await recordChange(tx, {
        id,
        action: "success_story.updated",
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
    console.error("[cms] failed to update a success story:", err);
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
  publish: "success_story.published",
  unpublish: "success_story.unpublished",
  archive: "success_story.archived",
  restore: "success_story.restored",
};

/** Move a story between draft / published / archived. */
export async function changeStoryStatus(
  id: string,
  change: StatusChange,
  actorId: string,
): Promise<WriteOutcome> {
  try {
    return await db.$transaction(async (tx) => {
      const existing = await tx.successStory.findFirst({ where: { id, deleted_at: null } });
      if (!existing) return { ok: false as const, reason: "not-found" as const };

      const nextStatus = STATUS_FOR[change];
      if (existing.status === nextStatus) {
        return { ok: true as const, id, changedFields: [] };
      }

      await tx.successStory.update({
        where: { id },
        data: {
          status: nextStatus,
          updated_by_id: actorId,
          // published_at records the FIRST publication and is not cleared on
          // unpublish, so "when did this first go live" stays answerable.
          published_at:
            change === "publish" ? (existing.published_at ?? new Date()) : existing.published_at,
          archived_at: change === "archive" ? new Date() : null,
        },
      });

      const base = {
        category: existing.category,
        full_name: existing.full_name,
        profile_image_url: existing.profile_image_url,
        linkedin_url: existing.linkedin_url,
        previous_designation: existing.previous_designation,
        previous_company: existing.previous_company,
        current_designation: existing.current_designation,
        current_company: existing.current_company,
        growth_headline: existing.growth_headline,
        growth_description: existing.growth_description,
        short_description: existing.short_description,
        full_story: existing.full_story,
        testimonial: existing.testimonial,
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
    console.error("[cms] failed to change a success story's status:", err);
    return { ok: false, reason: "unavailable" };
  }
}

/**
 * Reorder within one category. Positions are rewritten from the supplied
 * sequence, so the result is always a dense 1..n with no gaps or ties.
 */
export async function reorderStories(
  category: AlumniCategory,
  orderedIds: string[],
  actorId: string,
): Promise<WriteOutcome> {
  try {
    return await db.$transaction(async (tx) => {
      const rows = await tx.successStory.findMany({
        where: { category, deleted_at: null },
        select: { id: true },
      });
      const known = new Set(rows.map((r) => r.id));

      // Ignore anything not in this category — a reorder must never be able to
      // move a story between categories as a side effect.
      const ids = orderedIds.filter((id) => known.has(id));

      for (const [index, id] of ids.entries()) {
        await tx.successStory.update({
          where: { id },
          data: { display_order: index + 1, updated_by_id: actorId },
        });
      }

      await tx.auditLog.create({
        data: {
          cms_user_id: actorId,
          action: "success_story.reordered",
          entity_type: STORY_ENTITY,
          entity_id: category,
          entity_name: category === AlumniCategory.COHORT_ALUMNI
            ? "Cohort Alumni"
            : "Advanced Module Alumni",
          after: { order: ids },
        },
      });

      return { ok: true as const, id: category, changedFields: ["display_order"] };
    });
  } catch (err) {
    if (isMissingTable(err)) return { ok: false, reason: "not-provisioned" };
    console.error("[cms] failed to reorder success stories:", err);
    return { ok: false, reason: "unavailable" };
  }
}

/** Version history for one story, newest first. */
export async function getStoryVersions(id: string, take = 20) {
  try {
    return await db.contentVersion.findMany({
      where: { entity_type: STORY_ENTITY, entity_id: id },
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
