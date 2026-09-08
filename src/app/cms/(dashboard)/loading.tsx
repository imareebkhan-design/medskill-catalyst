import { Skeleton } from "@/src/components/cms/ui";

/** Shown while the dashboard's queries resolve. Mirrors the real layout so
 *  the page does not jump when content arrives. */
export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-9 w-72" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-40 w-full rounded-msc-lg" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-32 rounded-msc-lg" />
        <Skeleton className="h-32 rounded-msc-lg" />
        <Skeleton className="h-32 rounded-msc-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-24 rounded-msc-lg" />
        <Skeleton className="h-24 rounded-msc-lg" />
      </div>
    </div>
  );
}
