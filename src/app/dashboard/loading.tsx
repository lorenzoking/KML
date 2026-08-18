import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-8" aria-label="Loading dashboard">
      <div className="space-y-2 pt-1">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-10 w-48 max-w-full" />
      </div>
      <Skeleton className="h-[4.75rem] w-full rounded-[1.6rem]" />
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            <Skeleton className="size-[3.35rem] rounded-[1.15rem]" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
      <Skeleton className="aspect-[16/10] w-full rounded-[1.6rem]" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-[1.4rem]" />
        ))}
      </div>
    </div>
  );
}
