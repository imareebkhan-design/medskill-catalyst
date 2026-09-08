import { guardCmsPage } from "@/src/lib/cms-guard";
import { ComingSoon } from "@/src/components/cms/coming-soon";

export const dynamic = "force-dynamic";
export const metadata = { title: "Success Stories" };

export default async function SuccessStoriesPage() {
  await guardCmsPage();
  return (
    <ComingSoon
      title="Success Stories"
      subtitle="Alumni career transitions shown on the website."
      summary="You'll be able to add alumni with their photo, career move and testimonial, keep Cohort Alumni and Advanced Module Alumni in separate groups, drag them into the order you want, and publish when ready."
    />
  );
}
