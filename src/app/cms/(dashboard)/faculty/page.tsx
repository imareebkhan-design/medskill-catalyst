import Link from "next/link";
import { guardCmsPage } from "@/src/lib/cms-guard";
import { can } from "@/src/lib/cms-roles";
import { ContentStatus } from "@/src/generated/prisma/enums";
import { listFaculty } from "@/src/modules/cms/faculty";
import { Card, EmptyState, ErrorState, PageHeader } from "@/src/components/cms/ui";
import { Icon } from "@/src/components/cms/icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Faculty" };

const STATUS_STYLE: Record<ContentStatus, string> = {
  [ContentStatus.PUBLISHED]: "bg-emerald-50 text-success",
  [ContentStatus.DRAFT]: "bg-brand-pale text-brand-blue",
  [ContentStatus.ARCHIVED]: "bg-brand-navy/8 text-muted",
};

const STATUS_LABEL: Record<ContentStatus, string> = {
  [ContentStatus.PUBLISHED]: "Live",
  [ContentStatus.DRAFT]: "Draft",
  [ContentStatus.ARCHIVED]: "Archived",
};

function Portrait({ src, name }: { src: string | null; name: string }) {
  const initials = name
    .replace(/^Dr\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  if (!src) {
    return (
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-navy/8 text-xs font-bold text-muted">
        {initials}
      </span>
    );
  }
  // Plain <img>: sources may be relative site paths, and a broken file should
  // degrade to a blank circle rather than break the row.
  return (
    <img
      src={src.startsWith("http") || src.startsWith("/") ? src : `/${src}`}
      alt=""
      loading="lazy"
      className="h-12 w-12 shrink-0 rounded-full bg-brand-navy/8 object-cover"
    />
  );
}

export default async function FacultyPage() {
  const user = await guardCmsPage();
  const canEdit = can(user, "content:edit");
  const result = await listFaculty();

  const header = (
    <PageHeader
      title="Faculty"
      subtitle="The mentors introduced on the website, in the order they appear."
      action={
        canEdit ? (
          <Link
            href="/cms/faculty/new"
            className="inline-flex items-center gap-2 rounded-pill bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white shadow-msc-sm transition hover:bg-brand-navy"
          >
            <Icon name="plus" className="h-4 w-4" />
            Add mentor
          </Link>
        ) : undefined
      }
    />
  );

  if (result.status !== "ok") {
    return (
      <>
        {header}
        <ErrorState
          title={
            result.status === "not-provisioned"
              ? "Your content workspace is still being set up"
              : "We can't load the faculty right now"
          }
          description={
            result.status === "not-provisioned"
              ? "This area hasn't finished being set up yet. It's a one-time step your developer completes. Nothing is broken, and no content has been lost."
              : "Something went wrong while loading the faculty list. This is usually temporary — please try again in a moment. Nothing has been lost."
          }
        >
          <Link
            href="/cms/faculty"
            className="inline-flex rounded-pill bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white shadow-msc-sm transition hover:bg-brand-navy"
          >
            Try again
          </Link>
        </ErrorState>
      </>
    );
  }

  const faculty = result.data;

  if (faculty.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          title="No faculty yet"
          description="Add a mentor with their role, expertise and biography. Nothing appears on the website until you publish it."
          actionLabel={canEdit ? "Add the first mentor" : undefined}
          actionHref={canEdit ? "/cms/faculty/new" : undefined}
        />
      </>
    );
  }

  const live = faculty.filter((f) => f.status === ContentStatus.PUBLISHED).length;

  return (
    <>
      {header}

      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          All mentors
        </h2>
        <span className="text-xs text-muted">
          {live} live of {faculty.length}
        </span>
      </div>

      <Card className="!p-0">
        <ul className="divide-y divide-brand-navy/8">
          {faculty.map((member) => (
            <li key={member.id}>
              <Link
                href={`/cms/faculty/${member.id}`}
                className="flex items-center gap-4 px-5 py-4 transition hover:bg-canvas"
              >
                <span className="w-6 shrink-0 text-xs font-semibold tabular-nums text-muted">
                  {member.displayOrder}
                </span>
                <Portrait src={member.profileImageUrl} name={member.fullName} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {member.fullName}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {member.designation}
                    {member.organization ? ` · ${member.organization}` : ""}
                  </span>
                  {member.expertise.length > 0 && (
                    <span className="mt-1.5 flex flex-wrap gap-1.5">
                      {member.expertise.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-pill bg-brand-pale px-2 py-0.5 text-[0.68rem] font-medium text-brand-blue"
                        >
                          {tag}
                        </span>
                      ))}
                      {member.expertise.length > 3 && (
                        <span className="text-[0.68rem] text-muted">
                          +{member.expertise.length - 3} more
                        </span>
                      )}
                    </span>
                  )}
                </span>
                <span
                  className={`inline-flex shrink-0 items-center rounded-pill px-2.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide ${STATUS_STYLE[member.status]}`}
                >
                  {STATUS_LABEL[member.status]}
                </span>
                <span className="hidden text-xs font-medium text-brand-blue sm:block">
                  {canEdit ? "Edit" : "View"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <p className="mt-4 text-xs text-muted">
        Numbers show the order mentors appear in on the website.
      </p>
    </>
  );
}
