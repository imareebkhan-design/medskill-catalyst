import { guardCmsCapability } from "@/src/lib/cms-guard";
import { ComingSoon } from "@/src/components/cms/coming-soon";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

/** Super Admin only — enforced here on the server, not by hiding the link. */
export default async function SettingsPage() {
  await guardCmsCapability("settings:access");
  return (
    <ComingSoon
      title="Settings"
      subtitle="Manage who can sign in and what they can do."
      summary="You'll be able to invite team members, set whether each person can publish or only draft, and remove access when someone leaves."
    />
  );
}
