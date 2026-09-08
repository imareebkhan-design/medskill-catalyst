import Link from "next/link";
import { notFound } from "next/navigation";
import { guardCmsPage } from "@/src/lib/cms-guard";
import { can } from "@/src/lib/cms-roles";
import { ContentStatus } from "@/src/generated/prisma/enums";
import { getFaculty, getFacultyVersions } from "@/src/modules/cms/faculty";
import { Card, ErrorState, PageHeader } from "@/src/components/cms/ui";
import { formatActivityTime } from "@/src/lib/cms-format";
import { FacultyForm, type FacultyFormValues } from "../faculty-form";
import { FacultyStatusControls } from "./status-controls";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit mentor" };

export default async function EditFacultyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const user = await guardCmsPage();
  const { id } = await params;
  const { created } = await searchParams;

  const result = await getFaculty(id);

  if (result.status !== "ok") {
    return (
      <>
        <PageHeader title="Faculty" />
        <ErrorState
          title={
            result.status === "not-provisioned"
              ? "Your content workspace is still being set up"
              : "We can't load this right now"
          }
          description="Nothing has been lost. Please try again in a moment."
        >
          <Link
            href="/cms/faculty"
            className="inline-flex rounded-pill bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white shadow-msc-sm transition hover:bg-brand-navy"
          >
            Back to Faculty
          </Link>
        </ErrorState>
      </>
    );
  }

  const member = result.data;
  if (!member) notFound();

  const canEdit = can(user, "content:edit");
  const versions = await getFacultyVersions(member.id, 5);

  const initial: FacultyFormValues = {
    full_name: member.fullName,
    designation: member.designation,
    organization: member.organization ?? "",
    profile_image_url: member.profileImageUrl ?? "",
    years_experience:
      member.yearsExperience === null ? "" : String(member.yearsExperience),
    experience_display: member.experienceDisplay ?? "",
    short_bio: member.shortBio ?? "",
    full_bio: member.fullBio ?? "",
  };

  const STATUS_TEXT: Record<ContentStatus, string> = {
    [ContentStatus.PUBLISHED]: "Live on the website",
    [ContentStatus.DRAFT]: "Draft — not on the website",
    [ContentStatus.ARCHIVED]: "Archived — not on the website",
  };

  return (
    <>
      <PageHeader
        title={member.fullName}
        subtitle={STATUS_TEXT[member.status]}
        action={
          <Link
            href="/cms/faculty"
            className="text-sm font-semibold text-brand-blue hover:underline"
          >
            ← All faculty
          </Link>
        }
      />

      {created && (
        <div
          role="status"
          className="mb-6 rounded-msc-lg border border-success/25 bg-emerald-50 px-5 py-4 text-sm font-medium text-success"
        >
          Mentor created as a draft. Publish them when you are ready.
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0">
          <FacultyForm
            facultyId={member.id}
            initial={initial}
            initialExpertise={member.expertise}
            canEdit={canEdit}
          />
        </div>

        <aside className="space-y-5">
          <Card>
            <h2 className="mb-4 font-display text-base font-bold text-brand-navy">
              Publishing
            </h2>
            <FacultyStatusControls
              facultyId={member.id}
              status={member.status}
              canPublish={can(user, "content:publish")}
              canArchive={can(user, "content:archive")}
            />
          </Card>

          <Card>
            <h2 className="mb-3 font-display text-base font-bold text-brand-navy">
              Change history
            </h2>
            {versions.length === 0 ? (
              <p className="text-sm text-muted">No changes recorded yet.</p>
            ) : (
              <ul className="space-y-3">
                {versions.map((v) => (
                  <li key={v.id} className="text-xs">
                    <span className="font-semibold text-ink">
                      Version {v.version_number}
                    </span>
                    <span className="block text-muted">
                      {v.created_by?.full_name ?? "Someone"} ·{" "}
                      {formatActivityTime(v.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 border-t border-brand-navy/8 pt-3 text-xs leading-relaxed text-muted">
              Every change is kept. Nothing is overwritten.
            </p>
          </Card>
        </aside>
      </div>
    </>
  );
}
