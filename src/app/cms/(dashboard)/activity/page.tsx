import { guardCmsCapability } from "@/src/lib/cms-guard";
import { ComingSoon } from "@/src/components/cms/coming-soon";

export const dynamic = "force-dynamic";
export const metadata = { title: "Activity Log" };

/** Super Admin only — enforced here on the server, not by hiding the link. */
export default async function ActivityPage() {
  await guardCmsCapability("activity:view");
  return (
    <ComingSoon
      title="Activity Log"
      subtitle="A record of every content change your team makes."
      summary="You'll see who changed what and when, with the before and after of each edit, so nothing on the website is ever a mystery."
    />
  );
}
