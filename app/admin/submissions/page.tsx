import { requireRole } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { DashboardLayout } from "@/components/core/layout/dashboard-layout";
import { SubmissionRow } from "@/components/core/submission/submission-row";
import type { SubmissionDoc } from "@/lib/types";

async function getSubmissions() {
  const db = await getDb();
  const docs = await db
    .collection<SubmissionDoc>("submissions")
    .find(
      {},
      {
        projection: {
          userId: 1, userName: 1, placeOfWork: 1, workDescription: 1,
          vehicleNumber: 1, startTime: 1, editedStartTime: 1, endTime: 1,
          diesel: 1, dieselAmount: 1, paid: 1, createdAt: 1,
          images: { $slice: 1 },
          billPhoto: 0,
        },
      }
    )
    .sort({ createdAt: -1 })
    .toArray();

  return docs.map((d) => ({
    id: d._id!.toString(),
    userName: d.userName,
    placeOfWork: d.placeOfWork,
    workDescription: d.workDescription,
    vehicleNumber: d.vehicleNumber,
    startTime: d.startTime,
    editedStartTime: d.editedStartTime ?? null,
    endTime: d.endTime ?? null,
    diesel: d.diesel ?? false,
    dieselAmount: d.dieselAmount ?? null,
    images: d.images ?? [],
    billPhoto: null as string | null,
    paid: d.paid ?? false,
    createdAt: d.createdAt.toISOString(),
  }));
}

export default async function AdminSubmissionsPage() {
  await requireRole("admin");
  const submissions = await getSubmissions();

  return (
    <DashboardLayout
      role="admin"
      title="Submissions"
      subtitle="All work submitted by staff."
    >
      {submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-background px-6 py-12 text-center md:rounded-3xl md:py-16">
          <p className="text-sm font-medium text-foreground">No submissions yet</p>
          <p className="text-xs text-muted-foreground">Submissions from staff will appear here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {submissions.map((s) => (
            <SubmissionRow key={s.id} s={{ ...s, href: "/admin/submissions" }} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
