import Link from "next/link";
import { guardCmsPage } from "@/src/lib/cms-guard";
import { can } from "@/src/lib/cms-roles";
import { AlumniCategory, ContentStatus } from "@/src/generated/prisma/enums";
import { listStories, type StoryListItem } from "@/src/modules/cms/success-stories";
import { Card, EmptyState, ErrorState, PageHeader } from "@/src/components/cms/ui";
import { Icon } from "@/src/components/cms/icons";
import { CATEGORY_OPTIONS } from "@/src/modules/cms/success-story-schema";

export const dynamic = "force-dynamic";
export const metadata = { title: "Success Stories" };

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

function StatusPill({ status }: { status: ContentStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-pill px-2.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function Avatar({ src, name }: { src: string | null; name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  if (!src) {
    return (
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-navy/8 text-xs font-bold text-muted">
        {initials}
      </span>
    );
  }
  // Plain <img>: sources may be relative site paths, and a broken file must
  // degrade to a blank circle rather than break the row.
  return (
    <img
      src={src.startsWith("http") || src.startsWith("/") ? src : `/${src}`}
      alt=""
      loading="lazy"
      className="h-11 w-11 shrink-0 rounded-full bg-brand-navy/8 object-cover"
    />
  );
}

function transition(story: StoryListItem): string | null {
  const { previousDesignation: from, currentDesignation: to } = story;
  if (from && to) return `${from} → ${to}`;
  return story.growthHeadline ?? to ?? from ?? null;
}

function CategoryGroup({
  label,
  stories,
  canEdit,
}: {
  label: string;
  stories: StoryListItem[];
  canEdit: boolean;
}) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          {label}
        </h2>
        <span className="text-xs text-muted">
          {stories.filter((s) => s.status === ContentStatus.PUBLISHED).length} live of{" "}
          {stories.length}
        </span>
      </div>

      {stories.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">Nobody in this group yet.</p>
        </Card>
      ) : (
        <Card className="!p-0">
          <ul className="divide-y divide-brand-navy/8">
            {stories.map((story) => (
              <li key={story.id}>
                <Link
                  href={`/cms/success-stories/${story.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition hover:bg-canvas"
                >
                  <span className="w-6 shrink-0 text-xs font-semibold tabular-nums text-muted">
                    {story.displayOrder}
                  </span>
                  <Avatar src={story.profileImageUrl} name={story.fullName} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">
                      {story.fullName}
                    </span>
                    {transition(story) && (
                      <span className="block truncate text-xs text-muted">
                        {transition(story)}
                      </span>
                    )}
                  </span>
                  <StatusPill status={story.status} />
                  <span className="hidden text-xs font-medium text-brand-blue sm:block">
                    {canEdit ? "Edit" : "View"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}

export default async function SuccessStoriesPage() {
  const user = await guardCmsPage();
  const canEdit = can(user, "content:edit");
  const result = await listStories();

  const header = (
    <PageHeader
      title="Success Stories"
      subtitle="Alumni career moves, grouped the way they appear on the website."
      action={
        canEdit ? (
          <Link
            href="/cms/success-stories/new"
            className="inline-flex items-center gap-2 rounded-pill bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white shadow-msc-sm transition hover:bg-brand-navy"
          >
            <Icon name="plus" className="h-4 w-4" />
            Add alumnus
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
              : "We can't load these right now"
          }
          description={
            result.status === "not-provisioned"
              ? "This area hasn't finished being set up yet. It's a one-time step your developer completes. Nothing is broken, and no content has been lost."
              : "Something went wrong while loading the alumni list. This is usually temporary — please try again in a moment. Nothing has been lost."
          }
        >
          <Link
            href="/cms/success-stories"
            className="inline-flex rounded-pill bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white shadow-msc-sm transition hover:bg-brand-navy"
          >
            Try again
          </Link>
        </ErrorState>
      </>
    );
  }

  const stories = result.data;

  if (stories.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          title="No success stories yet"
          description="Add an alumnus with their career move and testimonial. Nothing appears on the website until you publish it."
          actionLabel={canEdit ? "Add the first alumnus" : undefined}
          actionHref={canEdit ? "/cms/success-stories/new" : undefined}
        />
      </>
    );
  }

  return (
    <>
      {header}
      {CATEGORY_OPTIONS.map((opt) => (
        <CategoryGroup
          key={opt.value}
          label={opt.label}
          stories={stories.filter((s) => s.category === (opt.value as AlumniCategory))}
          canEdit={canEdit}
        />
      ))}
      <p className="text-xs text-muted">
        Numbers show the order each group appears in on the website.
      </p>
    </>
  );
}
