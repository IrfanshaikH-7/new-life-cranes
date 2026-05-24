import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Fuel, Receipt, CheckCircle2, Clock } from "lucide-react";
import { ObjectId } from "mongodb";
import { requireRole } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { DashboardLayout } from "@/components/core/layout/dashboard-layout";
import { ImageGallery } from "@/components/core/submission/image-gallery";
import { EditSubmissionDialog } from "../../edit-submission-dialog";
import { formatDate } from "@/lib/utils";
import type { SubmissionDoc } from "@/lib/types";

function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const h = d.getUTCHours();
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m} ${ampm}`;
}

async function getSubmission(id: string, userId: string) {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  return db.collection<SubmissionDoc>("submissions").findOne({
    _id: new ObjectId(id),
    userId,
  });
}

export default async function StaffSubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("staff");
  const { id } = await params;
  const doc = await getSubmission(id, session.userId);
  if (!doc) notFound();

  const displayStart = doc.editedStartTime ?? doc.startTime;

  const editable = {
    id,
    placeOfWork: doc.placeOfWork,
    workDescription: doc.workDescription,
    vehicleNumber: doc.vehicleNumber,
    startTime: doc.startTime,
    editedStartTime: doc.editedStartTime ?? null,
    endTime: doc.endTime ?? null,
    diesel: doc.diesel,
    dieselAmount: doc.dieselAmount ?? null,
    images: doc.images,
    billPhoto: doc.billPhoto ?? null,
  };

  return (
    <DashboardLayout role="staff" title="Submission detail">
      <div className="flex flex-col gap-4">
        {/* Back + edit */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/staff/submissions"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            My Work
          </Link>
          <EditSubmissionDialog submission={editable} />
        </div>

        {/* Image gallery */}
        <div className="overflow-hidden rounded-2xl border border-border bg-background md:rounded-3xl">
          <ImageGallery images={doc.images} billPhoto={doc.billPhoto} />
        </div>

        {/* Details card */}
        <div className="rounded-2xl border border-border bg-background p-5 md:rounded-3xl md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-foreground">{doc.placeOfWork}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(doc.createdAt)}</p>
            </div>
            {doc.paid && (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-950/40 dark:text-green-400">
                <CheckCircle2 className="size-3.5" /> Paid
              </span>
            )}
          </div>

          {/* Meta grid */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MetaItem label="Vehicle" value={doc.vehicleNumber} />
            <MetaItem
              label="Start time"
              value={fmtTime(displayStart)}
              icon={<Clock className="size-3.5 text-muted-foreground" />}
            />
            {doc.endTime && (
              <MetaItem
                label="End time"
                value={fmtTime(doc.endTime)}
                icon={<Clock className="size-3.5 text-muted-foreground" />}
              />
            )}
            {doc.editedStartTime && (
              <MetaItem label="Original start" value={fmtTime(doc.startTime)} muted />
            )}
          </div>

          {/* Diesel */}
          {doc.diesel && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/20">
              <Fuel className="size-4 text-amber-500" />
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Diesel filled</p>
                {doc.dieselAmount != null && (
                  <p className="text-xs text-amber-600 dark:text-amber-500">₹{doc.dieselAmount}</p>
                )}
              </div>
            </div>
          )}

          {/* Bill badge */}
          {doc.billPhoto && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Receipt className="size-3.5" />
              Bill photo attached — view in the gallery above
            </div>
          )}

          {/* Description */}
          <div className="mt-5 border-t border-border pt-4">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Work description</p>
            <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">{doc.workDescription}</p>
          </div>

          {/* Admin remark (read-only for staff) */}
          {doc.adminRemark && (
            <div className="mt-4 rounded-xl border border-border bg-muted/40 px-4 py-3">
              <p className="mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">Admin note</p>
              <p className="text-sm text-foreground">{doc.adminRemark}</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function MetaItem({
  label,
  value,
  icon,
  muted,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1">
        {icon}
        <p className={`text-sm font-medium ${muted ? "text-muted-foreground" : "text-foreground"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
