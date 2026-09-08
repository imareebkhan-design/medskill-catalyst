import Link from "next/link";
import { guardCmsPage } from "@/src/lib/cms-guard";
import { can } from "@/src/lib/cms-roles";
import { getActiveCohort, utcToDateOnly } from "@/src/modules/cms/cohort";
import { Card, ErrorState, PageHeader } from "@/src/components/cms/ui";
import { formatActivityTime } from "@/src/lib/cms-format";
import { CohortForm, type CohortFormValues } from "./cohort-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cohort Settings" };

/** Sensible starting point for a first-time setup. */
const BLANK: CohortFormValues = {
  cohort_name: "",
  start_date: "",
  start_time: "",
  admissions_status: "OPEN",
  duration: "",
  registration_url: "",
};

export default async function CohortPage() {
  // Anyone signed in may view. Changing it requires content:publish, enforced
  // again inside the server action — the form being editable is not the gate.
  const user = await guardCmsPage();
  const canPublish = can(user, "content:publish");
  const result = await getActiveCohort();

  if (result.status !== "ok") {
    return (
      <>
        <PageHeader
          title="Cohort Settings"
          subtitle="One place to set the cohort details shown across the website."
        />
        <ErrorState
          title={
            result.status === "not-provisioned"
              ? "Your content workspace is still being set up"
              : "We can't load the cohort right now"
          }
          description={
            result.status === "not-provisioned"
              ? "This area hasn't finished being set up yet. It's a one-time step your developer completes before the team starts using it. Nothing is broken, and no content has been lost."
              : "Something went wrong while loading the cohort details. This is usually temporary — please try again in a moment. Nothing has been lost."
          }
        >
          <Link
            href="/cms/cohort"
            className="inline-flex rounded-pill bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white shadow-msc-sm transition hover:bg-brand-navy"
          >
            Try again
          </Link>
        </ErrorState>
      </>
    );
  }

  const cohort = result.cohort;
  const isNew = cohort === null;

  const initial: CohortFormValues = cohort
    ? {
        cohort_name: cohort.cohortName,
        start_date: utcToDateOnly(cohort.startDate),
        start_time: cohort.startTime ?? "",
        admissions_status: cohort.admissionsStatus,
        duration: cohort.duration ?? "",
        registration_url: cohort.registrationUrl ?? "",
      }
    : BLANK;

  return (
    <>
      <PageHeader
        title="Cohort Settings"
        subtitle="Update the information for the current MedSkills Catalyst cohort."
      />

      {isNew && (
        <div className="mb-6 rounded-msc-lg border border-dashed border-brand-navy/20 bg-surface px-5 py-4">
          <p className="font-display text-base font-bold text-brand-navy">
            No cohort has been set up yet
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {canPublish
              ? "Fill in the details below to set up your first cohort. Nothing appears on the website until you publish."
              : "Nothing has been set up yet. A Content Admin can add the cohort details."}
          </p>
        </div>
      )}

      <Card>
        <CohortForm initial={initial} isNew={isNew} canPublish={canPublish} />
      </Card>

      {cohort && (
        <p className="mt-4 text-xs text-muted">
          Last updated {formatActivityTime(cohort.updatedAt)}
          {cohort.updatedByName ? ` by ${cohort.updatedByName}` : ""}.
        </p>
      )}
    </>
  );
}
