import { redirect } from "next/navigation";
import { getCmsUser } from "@/src/lib/cms-auth";
import { navFor } from "@/src/lib/cms-nav";
import { ROLE_LABELS } from "@/src/lib/cms-roles";
import { CmsShell } from "@/src/components/cms/shell";
import { logoutAction } from "../actions";

export const dynamic = "force-dynamic";

/**
 * Chrome for every signed-in CMS screen. The login page sits outside this
 * route group, so it renders without a sidebar.
 *
 * The redirect below is defence in depth, NOT the security boundary: in the
 * App Router a layout can be skipped on client-side navigation, so each page
 * calls guardCmsPage()/guardCmsCapability() for itself. This exists because
 * the shell genuinely needs a user to render, and bouncing is nicer than
 * rendering empty chrome.
 */
export default async function CmsDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCmsUser();
  if (!user) redirect("/cms/login");

  return (
    <CmsShell
      sections={navFor(user.role)}
      user={{
        fullName: user.full_name,
        email: user.email,
        roleLabel: ROLE_LABELS[user.role],
      }}
      logout={
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full px-4 py-2.5 text-left text-sm font-medium text-danger transition hover:bg-red-50"
          >
            Sign out
          </button>
        </form>
      }
    >
      {children}
    </CmsShell>
  );
}
