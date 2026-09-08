import { guardCmsPage } from "@/src/lib/cms-guard";
import { ComingSoon } from "@/src/components/cms/coming-soon";

export const dynamic = "force-dynamic";
export const metadata = { title: "Faculty" };

export default async function FacultyPage() {
  await guardCmsPage();
  return (
    <ComingSoon
      title="Faculty"
      subtitle="The mentors introduced on the website."
      summary="You'll be able to add each mentor's photo, role, experience, expertise tags and biography, arrange the order they appear in, and publish when ready."
    />
  );
}
