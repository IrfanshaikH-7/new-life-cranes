import { LayoutGrid, MessageSquareText } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { DashboardLayout } from "@/components/core/layout/dashboard-layout";

async function getStats() {
  const db = await getDb();
  const [staffCount, submissionCount] = await Promise.all([
    db.collection("users").countDocuments({ role: "staff" }),
    db.collection("submissions").countDocuments({}),
  ]);
  return { staffCount, submissionCount };
}

export default async function AdminDashboardPage() {
  const session = await requireRole("admin");
  const { staffCount, submissionCount } = await getStats();

  return (
    <DashboardLayout
      role="admin"
      title="Dashboard"
      subtitle="Welcome to your AI-powered workspace"
    >
      <div className="flex flex-col gap-3 md:gap-4">
        <div className="rounded-2xl bg-muted/60 p-5 md:rounded-3xl md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="max-w-xl">
              <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-3xl">
                Welcome back, {session.name.split(" ")[0]}!
              </h2>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground md:mt-2 md:text-sm md:leading-6">
                Your workspace is ready. Manage staff accounts or review the
                latest submissions.
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
            icon={<LayoutGrid className="size-4" />}
            title="Staff Members"
            value={staffCount}
            description="Total active staff accounts in your workspace."
          />
          <StatCard
            icon={<MessageSquareText className="size-4" />}
            title="Submissions"
            value={submissionCount}
            description="Total work submissions across all staff."
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
  value: number;
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
