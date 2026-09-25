/**
 * Paths where third-party analytics/pixels must not load. Credential
 * verification URLs carry the verification token; sending them to ad or
 * analytics vendors would hand those vendors a link to a learner's credential.
 */
export function isTrackingExcludedPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === "/verify" || pathname.startsWith("/verify/");
}
