import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Fuel, Receipt, Clock, User, Car } from "lucide-react";
import { ObjectId } from "mongodb";
import { requireRole } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { DashboardLayout } from "@/components/core/layout/dashboard-layout";
import { ImageGallery } from "@/components/core/submission/image-gallery";
import { PaidForm } from "./paid-form";
import { Separator } from "@/components/ui/separator";
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

async function getSubmission(id: string) {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  return db.collection<SubmissionDoc>("submissions").findOne({ _id: new ObjectId(id) });
}

export default async function AdminSubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");
  const { id } = await params;
  const doc = await getSubmission(id);
  if (!doc) notFound();

  const displayStart = doc.editedStartTime ?? doc.startTime;

  return (
    <DashboardLayout role="admin" title="Submission detail">
      <div className="flex flex-col gap-4">
        {/* Back */}
        <Link
          href="/admin/submissions"
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          All submissions
        </Link>

        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          {/* Left column */}
          <div className="flex flex-col gap-4">
            {/* Gallery */}
            <div className="overflow-hidden rounded-2xl border border-border bg-background md:rounded-3xl">
              <ImageGallery images={doc.images} billPhoto={doc.billPhoto} />
            </div>

            {/* Details */}
            <div className="rounded-2xl border border-border bg-background p-5 md:rounded-3xl md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{doc.placeOfWork}</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(doc.createdAt)}</p>
                </div>
              </div>

              {/* Meta grid */}
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <MetaItem icon={<User className="size-3.5" />} label="Staff" value={doc.userName} />
                <MetaItem icon={<Car className="size-3.5" />} label="Vehicle" value={doc.vehicleNumber} />
                <MetaItem
                  icon={<Clock className="size-3.5" />}
                  label="Start time"
                  value={fmtTime(displayStart)}
                />
                {doc.endTime && (
                  <MetaItem
                    icon={<Clock className="size-3.5" />}
                    label="End time"
                    value={fmtTime(doc.endTime)}
                  />
                )}
                {doc.editedStartTime && (
                  <MetaItem label="Original start" value={fmtTime(doc.startTime)} muted />
                )}
              </div>

              {/* Diesel */}
              {doc.diesel && (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                  <Fuel className="size-4 shrink-0 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Diesel filled</p>
                    {doc.dieselAmount != null && (
                      <p className="text-xs text-amber-600 dark:text-amber-500">Amount: ₹{doc.dieselAmount}</p>
                    )}
                  </div>
                </div>
              )}

              {doc.billPhoto && (
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Receipt className="size-3.5" />
                  Bill photo attached — view in the gallery above
                </div>
              )}

              <Separator className="my-4" />

              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Work description
              </p>
              <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">
                {doc.workDescription}
              </p>
            </div>
          </div>

          {/* Right column — admin actions */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-border bg-background p-5 md:rounded-3xl md:p-6">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Admin actions</h3>
              <PaidForm
                submissionId={id}
                initialPaid={doc.paid ?? false}
                initialRemark={doc.adminRemark ?? null}
              />
            </div>
          </div>
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
      <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className={`text-sm font-medium ${muted ? "text-muted-foreground" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}
