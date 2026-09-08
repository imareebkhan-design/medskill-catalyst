import { guardCmsCapability } from "@/src/lib/cms-guard";
import { PageHeader } from "@/src/components/cms/ui";
import { BLANK_FACULTY, FacultyForm } from "../faculty-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Add mentor" };

export default async function NewFacultyPage() {
  // Open to every CMS role: the mentor is saved as a draft, and publishing is
  // a separate, separately-gated action.
  await guardCmsCapability("content:create");

  return (
    <>
      <PageHeader
        title="Add a mentor"
        subtitle="Saved as a draft. Nothing appears on the website until it is published."
      />
      <FacultyForm initial={BLANK_FACULTY} initialExpertise={[]} canEdit />
    </>
  );
}
