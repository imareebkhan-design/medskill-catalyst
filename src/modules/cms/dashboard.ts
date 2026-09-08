import "server-only";
import { db } from "@/src/lib/db";
import { AlumniCategory, ContentStatus } from "@/src/generated/prisma/enums";

/**
 * Read model for the CMS dashboard.
 *
 * One round trip, batched, and explicitly fault-tolerant: the dashboard is the
 * first thing a non-technical user sees, so a database problem must render as
 * a calm explanation rather than a stack trace or — worse — invented numbers.
 *
 * Read-only. Phase 4 owns no writes.
 */

export type CohortSummary = {
  name: string;
  startDate: Date;
  /** Canonical "HH:mm", or null. Formatting belongs to the view. */
  startTime: string | null;
  admissionsStatus: string;
  duration: string | null;
};

export type ActivityEntry = {
  id: string;
  action: string;
  entityType: string;
  entityName: string | null;
  actorName: string | null;
  at: Date;
};

export type DashboardData = {
  cohort: CohortSummary | null;
  stories: { published: number; drafts: number; byCategory: Record<string, number> };
  faculty: { published: number; drafts: number };
  activity: ActivityEntry[];
};

export type DashboardResult =
  | { status: "ok"; data: DashboardData }
  /** Tables absent — the migration has not been applied yet. */
  | { status: "not-provisioned" }
  /** Anything else: connection refused, timeout, permissions. */
  | { status: "unavailable" };

/** Prisma's code for "relation does not exist". */
function isMissingTable(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "P2021"
  );
}

export async function getDashboard(): Promise<DashboardResult> {
  try {
    const [
      cohort,
      publishedStories,
      draftStories,
      cohortAlumni,
      advancedAlumni,
      publishedFaculty,
      draftFaculty,
      activityRows,
    ] = await Promise.all([
      db.cohortSetting.findFirst({
        where: { is_active: true },
        select: {
          cohort_name: true,
          start_date: true,
          start_time: true,
          admissions_status: true,
          duration: true,
        },
      }),
      db.successStory.count({
        where: { status: ContentStatus.PUBLISHED, deleted_at: null },
      }),
      db.successStory.count({
        where: { status: ContentStatus.DRAFT, deleted_at: null },
      }),
      db.successStory.count({
        where: {
          category: AlumniCategory.COHORT_ALUMNI,
          status: ContentStatus.PUBLISHED,
          deleted_at: null,
        },
      }),
      db.successStory.count({
        where: {
          category: AlumniCategory.ADVANCED_MODULE_ALUMNI,
          status: ContentStatus.PUBLISHED,
          deleted_at: null,
        },
      }),
      db.faculty.count({ where: { status: ContentStatus.PUBLISHED, deleted_at: null } }),
      db.faculty.count({ where: { status: ContentStatus.DRAFT, deleted_at: null } }),
      // CMS entities only — CRM audit rows must never leak into this feed.
      db.auditLog.findMany({
        where: { entity_type: { in: CMS_ENTITY_TYPES } },
        orderBy: { created_at: "desc" },
        take: 8,
        select: {
          id: true,
          action: true,
          entity_type: true,
          entity_name: true,
          created_at: true,
          cms_user: { select: { full_name: true } },
        },
      }),
    ]);

    return {
      status: "ok",
      data: {
        cohort: cohort
          ? {
              name: cohort.cohort_name,
              startDate: cohort.start_date,
              startTime: cohort.start_time,
              admissionsStatus: cohort.admissions_status,
              duration: cohort.duration,
            }
          : null,
        stories: {
          published: publishedStories,
          drafts: draftStories,
          byCategory: {
            [AlumniCategory.COHORT_ALUMNI]: cohortAlumni,
            [AlumniCategory.ADVANCED_MODULE_ALUMNI]: advancedAlumni,
          },
        },
        faculty: { published: publishedFaculty, drafts: draftFaculty },
        activity: activityRows.map((row) => ({
          id: row.id,
          action: row.action,
          entityType: row.entity_type,
          entityName: row.entity_name,
          actorName: row.cms_user?.full_name ?? null,
          at: row.created_at,
        })),
      },
    };
  } catch (err) {
    if (isMissingTable(err)) {
      console.warn("[cms] dashboard: CMS tables are not provisioned yet.");
      return { status: "not-provisioned" };
    }
    console.error("[cms] dashboard query failed:", err);
    return { status: "unavailable" };
  }
}

/**
 * Entity types written by the CMS. The activity feed filters on this list so
 * CRM audit rows (leads, enrollments) — which share the audit_logs table —
 * never appear in the CMS view.
 */
export const CMS_ENTITY_TYPES = [
  "cohort_setting",
  "success_story",
  "faculty",
  "cms_user",
  "cms_auth",
];
