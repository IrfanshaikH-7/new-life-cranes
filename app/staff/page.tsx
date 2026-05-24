import { Briefcase, ImageIcon } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { DashboardLayout } from "@/components/core/layout/dashboard-layout";
import { CreateSubmissionDialog } from "./create-submission-dialog";
import { formatDate } from "@/lib/utils";
import type { SubmissionDoc } from "@/lib/types";

async function getMyStats(userId: string) {
  const db = await getDb();
  const submissions = db.collection<SubmissionDoc>("submissions");
  const [totalCount, lastDoc] = await Promise.all([
    submissions.countDocuments({ userId }),
    submissions
      .find({ userId }, { projection: { createdAt: 1 } })
      .sort({ createdAt: -1 })
      .limit(1)
      .next(),
  ]);
  return {
    totalCount,
    lastAt: lastDoc?.createdAt ?? null,
  };
}

export default async function StaffDashboardPage() {
  const session = await requireRole("staff");
  const { totalCount, lastAt } = await getMyStats(session.userId);

  return (
    <DashboardLayout
      role="staff"
      title="Dashboard"
      subtitle="Welcome to your workspace"
      headerAction={<CreateSubmissionDialog />}
    >
      <div className="flex flex-col gap-3 md:gap-4">
        <div className="rounded-2xl bg-muted/60 p-5 md:rounded-3xl md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="max-w-xl">
              <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-3xl">
                Welcome back, {session.name.split(" ")[0]}!
              </h2>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground md:mt-2 md:text-sm md:leading-6">
                Log your work for the day. Add up to 4 photos with the place of
                work and a short description.
              </p>
            </div>
            <div className="hidden grid-cols-2 gap-1.5 opacity-30 sm:grid md:gap-2">
              <div className="size-6 rounded-md border-2 border-foreground/40 md:size-8" />
              <div className="size-6 rounded-md border-2 border-foreground/40 md:size-8" />
              <div className="size-6 rounded-md border-2 border-foreground/40 md:size-8" />
              <div className="size-6 rounded-md border-2 border-foreground/40 md:size-8" />
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard
            icon={<Briefcase className="size-4" />}
            title="My Submissions"
            value={totalCount}
            description="Total work entries you've submitted."
          />
          <StatCard
            icon={<ImageIcon className="size-4" />}
            title="Last Submission"
            value={lastAt ? formatDate(lastAt) : "—"}
            description={
              lastAt
                ? "Date of your most recent entry."
                : "You haven't submitted any work yet."
            }
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4 md:rounded-3xl md:p-6">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground md:h-9 md:w-9">
        {icon}
      </div>
      <div className="mt-3 flex items-baseline gap-2 md:mt-4">
        <span className="text-xl font-semibold tracking-tight md:text-2xl">
          {value}
        </span>
        <span className="text-xs font-medium text-foreground md:text-sm">
          {title}
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-4 text-muted-foreground md:text-xs md:leading-5">
        {description}
      </p>
    </div>
  );
}
