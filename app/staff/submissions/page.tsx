import { requireRole } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { DashboardLayout } from "@/components/core/layout/dashboard-layout";
import { SubmissionCard } from "@/components/core/submission/submission-card";
import { CreateSubmissionDialog } from "../create-submission-dialog";
import type { SubmissionDoc } from "@/lib/types";

async function getMySubmissions(userId: string) {
  const db = await getDb();
  const docs = await db
    .collection<SubmissionDoc>("submissions")
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map((d) => ({
    id: d._id!.toString(),
    placeOfWork: d.placeOfWork,
    workDescription: d.workDescription,
    images: d.images,
    createdAt: d.createdAt,
  }));
}

export default async function StaffSubmissionsPage() {
  const session = await requireRole("staff");
  const submissions = await getMySubmissions(session.userId);

  return (
    <DashboardLayout
      role="staff"
      title="My Work"
      subtitle="A history of every submission you've made."
      headerAction={<CreateSubmissionDialog />}
    >
      {submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-background px-6 py-12 text-center md:rounded-3xl md:py-16">
          <p className="text-sm font-medium text-foreground">
            No submissions yet
          </p>
          <p className="text-xs text-muted-foreground">
            Tap “New submission” to log your first entry.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {submissions.map((s) => (
            <SubmissionCard key={s.id} submission={s} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
