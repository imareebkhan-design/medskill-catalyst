import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";
import { db } from "@/src/lib/db";
import { AlumniCategory, ContentStatus } from "@/src/generated/prisma/enums";
import { utcToDateOnly } from "@/src/modules/cms/cohort-dates";

/**
 * The public website's ONLY read path into CMS content.
 *
 * Deliberately separate from the CMS service modules (src/modules/cms/*):
 * those carry authorization, drafts, versioning and audit. This file carries
 * none of that. It is read-only, requires no session, and every query hard-codes
 * `status = PUBLISHED AND deleted_at IS NULL` so an unpublished or archived
 * record cannot reach a visitor even if a caller forgets to filter.
 *
 * Three rules hold everywhere in here:
 *
 *   1. Published only. The filter lives in the query, not in the caller.
 *   2. Minimal fields. A public page gets what it renders and nothing else —
 *      no internal ids beyond what is needed, no timestamps, no author.
 *   3. Never throw. A database problem returns null or an empty list so the
 *      page falls back to its existing markup instead of showing an error.
 */

export const SITE_TAGS = {
  cohort: "site:cohort",
  stories: "site:stories",
  faculty: "site:faculty",
} as const;

/** Called from CMS publish actions so a change reaches the site without a deploy. */
export function revalidateSiteContent(...tags: (keyof typeof SITE_TAGS)[]): void {
  for (const t of tags) revalidateTag(SITE_TAGS[t]);
}

const PUBLIC_ONLY = { status: ContentStatus.PUBLISHED, deleted_at: null } as const;

// ── Cohort ───────────────────────────────────────────────────────────

export type PublicCohort = {
  name: string;
  /**
   * Canonical "YYYY-MM-DD".
   *
   * Deliberately a string, not a Date: these readers are wrapped in
   * unstable_cache, which serialises whatever they return. A Date would come
   * back as a string anyway — but typed as a Date, so every call site would
   * lie about what it holds. Returning the string makes the type honest.
   */
  startDate: string;
  /** Canonical "HH:mm", or null. */
  startTime: string | null;
  admissionsStatus: string;
  duration: string | null;
  registrationUrl: string | null;
};

async function readCohort(): Promise<PublicCohort | null> {
  try {
    const row = await db.cohortSetting.findFirst({
      where: { is_active: true },
      select: {
        cohort_name: true,
        start_date: true,
        start_time: true,
        admissions_status: true,
        duration: true,
        registration_url: true,
      },
    });
    if (!row) return null;
    return {
      name: row.cohort_name,
      startDate: utcToDateOnly(row.start_date),
      startTime: row.start_time,
      admissionsStatus: row.admissions_status,
      duration: row.duration,
      registrationUrl: row.registration_url,
    };
  } catch (err) {
    // Includes the case where CMS tables do not exist yet. The caller falls
    // back to its existing content; visitors never see this.
    console.error("[site] cohort unavailable, falling back:", err);
    return null;
  }
}

export const getPublicCohort = unstable_cache(readCohort, ["site-cohort"], {
  tags: [SITE_TAGS.cohort],
});

// ── Success stories ──────────────────────────────────────────────────

export type PublicStory = {
  id: string;
  fullName: string;
  profileImageUrl: string | null;
  linkedinUrl: string | null;
  growthHeadline: string | null;
  previousDesignation: string | null;
  previousCompany: string | null;
  currentDesignation: string | null;
  currentCompany: string | null;
  shortDescription: string | null;
  testimonial: string | null;
};

export type PublicStories = {
  cohortAlumni: PublicStory[];
  advancedModuleAlumni: PublicStory[];
  total: number;
};

const EMPTY_STORIES: PublicStories = {
  cohortAlumni: [],
  advancedModuleAlumni: [],
  total: 0,
};

async function readStories(): Promise<PublicStories> {
  try {
    const rows = await db.successStory.findMany({
      where: PUBLIC_ONLY,
      orderBy: [{ category: "asc" }, { display_order: "asc" }],
      select: {
        id: true,
        category: true,
        full_name: true,
        profile_image_url: true,
        linkedin_url: true,
        growth_headline: true,
        previous_designation: true,
        previous_company: true,
        current_designation: true,
        current_company: true,
        short_description: true,
        testimonial: true,
      },
    });

    const map = (r: (typeof rows)[number]): PublicStory => ({
      id: r.id,
      fullName: r.full_name,
      profileImageUrl: r.profile_image_url,
      linkedinUrl: r.linkedin_url,
      growthHeadline: r.growth_headline,
      previousDesignation: r.previous_designation,
      previousCompany: r.previous_company,
      currentDesignation: r.current_designation,
      currentCompany: r.current_company,
      shortDescription: r.short_description,
      testimonial: r.testimonial,
    });

    return {
      cohortAlumni: rows
        .filter((r) => r.category === AlumniCategory.COHORT_ALUMNI)
        .map(map),
      advancedModuleAlumni: rows
        .filter((r) => r.category === AlumniCategory.ADVANCED_MODULE_ALUMNI)
        .map(map),
      total: rows.length,
    };
  } catch (err) {
    console.error("[site] success stories unavailable, falling back:", err);
    return EMPTY_STORIES;
  }
}

export const getPublicStories = unstable_cache(readStories, ["site-stories"], {
  tags: [SITE_TAGS.stories],
});

// ── Faculty ──────────────────────────────────────────────────────────

export type PublicFaculty = {
  id: string;
  fullName: string;
  designation: string;
  organization: string | null;
  profileImageUrl: string | null;
  experienceDisplay: string | null;
  shortBio: string | null;
  fullBio: string | null;
  expertise: string[];
};

async function readFaculty(): Promise<PublicFaculty[]> {
  try {
    const rows = await db.faculty.findMany({
      where: PUBLIC_ONLY,
      orderBy: [{ display_order: "asc" }],
      select: {
        id: true,
        full_name: true,
        designation: true,
        organization: true,
        profile_image_url: true,
        experience_display: true,
        short_bio: true,
        full_bio: true,
        expertise: {
          orderBy: { display_order: "asc" },
          select: { expertise_name: true },
        },
      },
    });

    return rows.map((r) => ({
      id: r.id,
      fullName: r.full_name,
      designation: r.designation,
      organization: r.organization,
      profileImageUrl: r.profile_image_url,
      experienceDisplay: r.experience_display,
      shortBio: r.short_bio,
      fullBio: r.full_bio,
      expertise: r.expertise.map((e) => e.expertise_name),
    }));
  } catch (err) {
    console.error("[site] faculty unavailable, falling back:", err);
    return [];
  }
}

export const getPublicFaculty = unstable_cache(readFaculty, ["site-faculty"], {
  tags: [SITE_TAGS.faculty],
});
