import { guardCmsCapability } from "@/src/lib/cms-guard";
import { PageHeader } from "@/src/components/cms/ui";
import { BLANK_STORY, StoryForm } from "../story-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Add alumnus" };

export default async function NewSuccessStoryPage() {
  // Creating is open to every CMS role, including Content Editors — the story
  // is saved as a draft and publishing is a separate, gated action.
  await guardCmsCapability("content:create");

  return (
    <>
      <PageHeader
        title="Add an alumnus"
        subtitle="Saved as a draft. Nothing appears on the website until it is published."
      />
      <StoryForm initial={BLANK_STORY} canEdit />
    </>
  );
}
