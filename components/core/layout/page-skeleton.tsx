import type { Role } from "@/lib/types";
import { AppSidebar } from "./app-sidebar";
import { Skeleton } from "./skeleton";

interface PageSkeletonProps {
  role: Role;
  /** "dashboard" | "list" | "detail" */
  variant?: "dashboard" | "list" | "detail";
}

export function PageSkeleton({ role, variant = "dashboard" }: PageSkeletonProps) {
  return (
    <div className="flex min-h-svh w-full bg-accent">
      <AppSidebar role={role} />
      <main className="flex-1 min-w-0 py-2 pr-2 md:py-3 md:pr-3">
        <div className="flex h-full flex-col gap-3 rounded-2xl bg-background p-3 md:gap-4 md:rounded-4xl md:p-4">
          {/* Header */}
          <div className="flex items-center justify-between px-1 pt-1">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-44" />
            </div>
            <Skeleton className="h-8 w-28 rounded-full" />
          </div>

          {variant === "dashboard" && (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-28 w-full rounded-2xl md:rounded-3xl" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-24 rounded-2xl md:rounded-3xl" />
                <Skeleton className="h-24 rounded-2xl md:rounded-3xl" />
              </div>
            </div>
          )}

          {variant === "list" && (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3">
                  <Skeleton className="size-[72px] shrink-0 rounded-xl" />
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {variant === "detail" && (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="aspect-video w-full rounded-2xl md:rounded-3xl" />
              <div className="rounded-2xl border border-border bg-background p-5 md:rounded-3xl">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-3 w-24 mb-4" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <Skeleton className="h-2.5 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
                <Skeleton className="mt-4 h-20 w-full" />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
