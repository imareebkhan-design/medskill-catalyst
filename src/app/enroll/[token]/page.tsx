import type { Metadata } from "next";
import { getEnrollmentLink } from "@/src/modules/enroll/service";
import { LinkStatus } from "@/src/generated/prisma/enums";
import { EnrollClient, type EnrollPageData } from "./enroll-client";
import { LinkProblem } from "./link-problem";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Complete your enrollment — MedSkills Catalyst",
  description:
    "Reserve your seat in the MedSkills Catalyst accelerator. Secure enrollment for life-science graduates entering MedTech.",
  robots: { index: false },
};

export default async function EnrollPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const link = await getEnrollmentLink(token);

  if (!link) {
    return (
      <LinkProblem
        title="This link isn't valid"
        body="The enrollment link you opened doesn't exist or was mistyped. Please use the exact link we sent you, or message us and we'll send a fresh one."
      />
    );
  }
  if (link.status === LinkStatus.EXPIRED) {
    return (
      <LinkProblem
        title="This link has expired"
        body="For security, enrollment links are valid for a limited time. Message us on WhatsApp and we'll send you a fresh link right away — your seat conversation is still open."
      />
    );
  }
  if (link.status === LinkStatus.REVOKED) {
    return (
      <LinkProblem
        title="This link is no longer active"
        body="This enrollment link was withdrawn. If you think this is a mistake, please contact us and we'll sort it out."
      />
    );
  }

  const data: EnrollPageData = {
    token,
    alreadyCompleted: link.status === LinkStatus.COMPLETED,
    course: {
      name: link.batch.course.name,
      description: link.batch.course.description,
      durationWeeks: link.batch.course.duration_weeks,
      mode: link.batch.course.mode,
      gstRatePct: Number(link.batch.course.gst_rate_pct),
    },
    batch: {
      name: link.batch.name,
      startDate: link.batch.start_date
        ? new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" }).format(
            link.batch.start_date,
          )
        : null,
      seatCapacity: link.batch.seat_capacity,
    },
    pricePaise: link.price_paise,
    discountPaise: link.discount_paise,
    expiresAt: new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeZone: "Asia/Kolkata",
    }).format(link.expires_at),
    lead: {
      name: link.lead.full_name,
      email: link.lead.email,
      phone: link.lead.mobile,
    },
  };

  return <EnrollClient data={data} />;
}
