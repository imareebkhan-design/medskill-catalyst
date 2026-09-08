import Link from "next/link";
import { guardCmsPage } from "@/src/lib/cms-guard";
import type { CmsSessionUser } from "@/src/lib/cms-auth";
import { can } from "@/src/lib/cms-roles";
import { getDashboard, type DashboardData } from "@/src/modules/cms/dashboard";
import {
  AdmissionsBadge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  QuickAction,
  StatCard,
} from "@/src/components/cms/ui";
import {
  describeAction,
  describeCountdown,
  formatActivityTime,
  formatCohortDate,
  formatStartTime,
} from "@/src/lib/cms-format";

export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard" };

function firstName(full: string): string {
  return full.split(/\s+/)[0] ?? full;
}

export default async function CmsDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  // Per-page guard. The layout's check is defence in depth, not the boundary.
  const user = await guardCmsPage();
  const { denied } = await searchParams;
  const result = await getDashboard();

  return (
    <>
      {denied && (
        <div
          role="alert"
          className="mb-6 rounded-msc-lg border border-warning/25 bg-amber-50 px-5 py-4 text-sm text-ink/80"
        >
          That section is available to Super Admins only. Ask a Super Admin if
          you need access.
        </div>
      )}

      <PageHeader
        title={`Welcome back, ${firstName(user.full_name)}`}
        subtitle="Manage and update MedSkills Catalyst website content from one place."
      />

      {result.status === "ok" ? (
        <DashboardBody data={result.data} user={user} />
      ) : (
        <ErrorState
          title={
            result.status === "not-provisioned"
              ? "Your content workspace is still being set up"
              : "We can't load your content right now"
          }
          description={
            result.status === "not-provisioned"
              ? "The website content area hasn't finished being set up yet. This is a one-time step your developer completes before the team starts using it. Nothing is broken, and no content has been lost."
              : "Something went wrong while loading your content. This is usually temporary — please try again in a moment. Nothing has been lost."
          }
        >
          <Link
            href="/cms"
            className="inline-flex rounded-pill bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white shadow-msc-sm transition hover:bg-brand-navy"
          >
            Try again
          </Link>
        </ErrorState>
      )}
    </>
  );
}

function DashboardBody({ data, user }: { data: DashboardData; user: CmsSessionUser }) {
  const { cohort, stories, faculty, activity } = data;
  const canPublish = can(user, "content:publish");

  return (
    <div className="space-y-8">
      {/* ── Current cohort ─────────────────────────────────────── */}
      <section aria-labelledby="cohort-heading">
        <h2 id="cohort-heading" className="sr-only">
          Current cohort
        </h2>
        {cohort ? (
          <Card>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted">Current cohort</p>
                <p className="mt-1 font-display text-2xl font-bold text-brand-navy">
                  {cohort.name}
                </p>

                <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
                  <div>
                    <dt className="text-xs font-medium text-muted">Starts</dt>
                    <dd className="mt-0.5 text-sm font-semibold text-ink">
                      {formatCohortDate(cohort.startDate)}
                      {formatStartTime(cohort.startTime) && (
                        <span className="font-normal text-muted">
                          {" "}
                          at {formatStartTime(cohort.startTime)}
                        </span>
                      )}
                    </dd>
                  </div>
                  {cohort.duration && (
                    <div>
                      <dt className="text-xs font-medium text-muted">Duration</dt>
                      <dd className="mt-0.5 text-sm font-semibold text-ink">
                        {cohort.duration}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs font-medium text-muted">Countdown</dt>
                    <dd className="mt-0.5 text-sm font-semibold text-ink">
                      {describeCountdown(cohort.startDate)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                <AdmissionsBadge status={cohort.admissionsStatus} />
                <Link
                  href="/cms/cohort"
                  className="rounded-pill border border-brand-navy/15 px-4 py-2 text-sm font-semibold text-brand-navy transition hover:bg-brand-navy hover:text-white"
                >
                  Update cohort
                </Link>
              </div>
            </div>
          </Card>
        ) : (
          <EmptyState
            title="No cohort set up yet"
            description="Add your cohort name, start date and admissions status to get started."
            actionLabel="Set up the cohort"
            actionHref="/cms/cohort"
          />
        )}
      </section>

      {/* ── Counts ─────────────────────────────────────────────── */}
      <section aria-labelledby="totals-heading">
        <h2
          id="totals-heading"
          className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted"
        >
          Current CMS content
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Success stories live"
            value={stories.published}
            hint={
              stories.drafts > 0
                ? `${stories.drafts} saved as ${stories.drafts === 1 ? "a draft" : "drafts"}`
                : "No drafts waiting"
            }
            href="/cms/success-stories"
          />
          <StatCard
            label="Faculty live"
            value={faculty.published}
            hint={
              faculty.drafts > 0
                ? `${faculty.drafts} saved as ${faculty.drafts === 1 ? "a draft" : "drafts"}`
                : "No drafts waiting"
            }
            href="/cms/faculty"
          />
          <StatCard
            label="Cohort alumni"
            value={stories.byCategory.COHORT_ALUMNI ?? 0}
            hint={`${stories.byCategory.ADVANCED_MODULE_ALUMNI ?? 0} advanced module alumni`}
            href="/cms/success-stories"
          />
        </div>
      </section>

      {/* ── Quick actions ──────────────────────────────────────── */}
      <section aria-labelledby="actions-heading">
        <h2
          id="actions-heading"
          className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted"
        >
          Quick actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <QuickAction
            href="/cms/cohort"
            label="Update cohort"
            description="Change the start date, time or admissions status."
            icon="calendar"
          />
          <QuickAction
            href="/cms/success-stories"
            label="Add a success story"
            description="Publish an alumni career transition."
            icon="stories"
          />
          <QuickAction
            href="/cms/faculty"
            label="Add a faculty member"
            description="Introduce a new mentor with their photo and bio."
            icon="faculty"
          />
          <QuickAction
            href="/"
            label="View website"
            description="Open the live site in a new tab."
            icon="external"
            external
          />
        </div>
        {!canPublish && (
          <p className="mt-3 text-xs text-muted">
            You can write and save drafts. A Content Admin publishes them to the
            website.
          </p>
        )}
      </section>

      {/* ── Recent activity ────────────────────────────────────── */}
      <section aria-labelledby="activity-heading">
        <h2
          id="activity-heading"
          className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted"
        >
          Recent activity
        </h2>
        {activity.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">
              Nothing yet. Changes your team makes to website content will show
              up here.
            </p>
          </Card>
        ) : (
          <Card className="!p-0">
            <ul className="divide-y divide-brand-navy/8">
              {activity.map((entry) => (
                <li key={entry.id} className="flex items-start gap-4 px-6 py-4">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-cyan" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">
                      {describeAction(entry.action)}
                      {entry.entityName && (
                        <span className="font-normal text-muted">
                          {" "}
                          — {entry.entityName}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {entry.actorName ?? "Someone"} ·{" "}
                      {formatActivityTime(entry.at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
