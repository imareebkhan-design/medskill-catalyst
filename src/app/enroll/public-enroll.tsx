import { notFound } from "next/navigation";
import { db } from "@/src/lib/db";
import { BatchStatus } from "@/src/generated/prisma/enums";
import { EnrollClient, type EnrollPageData } from "./[token]/enroll-client";

/**
 * Public, token-less enrollment surface for /[programme]/enroll pages. Loads the
 * course + its active cohort by slug and renders the same EnrollClient in
 * "public" mode (price comes from the Course record; the form collects the
 * buyer's details on submit).
 */
export async function PublicEnroll({ slug }: { slug: string }) {
  const course = await db.course.findUnique({ where: { slug } });
  if (!course || !course.is_active) notFound();

  const batch =
    (await db.batch.findFirst({
      where: { course_id: course.id, status: BatchStatus.ENROLLING },
      orderBy: { created_at: "desc" },
    })) ??
    (await db.batch.findFirst({ where: { course_id: course.id }, orderBy: { created_at: "desc" } }));
  if (!batch) notFound();

  const data: EnrollPageData = {
    token: "",
    alreadyCompleted: false,
    alreadyPaid: false,
    course: {
      name: course.name,
      description: course.description,
      durationWeeks: course.duration_weeks,
      mode: course.mode,
      gstRatePct: Number(course.gst_rate_pct),
    },
    batch: {
      name: batch.name,
      startDate: batch.start_date
        ? new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" }).format(
            batch.start_date,
          )
        : null,
      seatCapacity: batch.seat_capacity,
    },
    pricePaise: course.base_price_paise,
    discountPaise: 0,
    expiresAt: "",
    lead: { name: "", email: "", phone: null },
  };

  return <EnrollClient data={data} flow={{ kind: "public", courseSlug: slug }} />;
}
