import { requireRole } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { DashboardLayout } from "@/components/core/layout/dashboard-layout";
import { CreateStaffDialog } from "./create-staff-dialog";
import type { UserDoc } from "@/lib/types";

async function getStaff() {
  const db = await getDb();
  const docs = await db
    .collection<UserDoc>("users")
    .find({ role: "staff" })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map((d) => ({
    id: d._id!.toString(),
    name: d.name,
    email: d.email,
    createdAt: d.createdAt,
  }));
}

export default async function StaffPage() {
  await requireRole("admin");
  const staff = await getStaff();

  return (
    <DashboardLayout
      role="admin"
      title="Staff"
      subtitle="Manage staff accounts and access."
      headerAction={<CreateStaffDialog />}
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-background md:rounded-3xl">
        {staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 px-6 py-12 text-center md:py-16">
            <p className="text-sm font-medium text-foreground">
              No staff members yet
            </p>
            <p className="text-xs text-muted-foreground">
              Tap “Add staff” to create the first account.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            <div className="hidden grid-cols-[1fr_1fr_auto] gap-4 bg-muted/40 px-6 py-3 text-xs font-medium text-muted-foreground md:grid">
              <div>Name</div>
              <div>Email</div>
              <div>Created</div>
            </div>
            {staff.map((s) => (
              <div key={s.id}>
                {/* Mobile row */}
                <div className="flex items-center gap-3 px-3 py-3 md:hidden">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate text-sm font-medium text-foreground">
                      {s.name}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {s.email}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Desktop row */}
                <div className="hidden grid-cols-[1fr_1fr_auto] items-center gap-4 px-6 py-4 md:grid">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate text-sm font-medium text-foreground">
                      {s.name}
                    </span>
                  </div>
                  <div className="truncate text-sm text-muted-foreground">
                    {s.email}
                  </div>
                  <div className="shrink-0 text-xs text-muted-foreground">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
