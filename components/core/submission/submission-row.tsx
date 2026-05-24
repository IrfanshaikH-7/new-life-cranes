import Image from "next/image";
import Link from "next/link";
import { Fuel, Receipt, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface SubmissionRowData {
  id: string;
  userName?: string;
  placeOfWork: string;
  workDescription: string;
  vehicleNumber?: string;
  startTime?: string | null;
  editedStartTime?: string | null;
  endTime?: string | null;
  diesel?: boolean;
  dieselAmount?: number | null;
  images: string[];
  billPhoto?: string | null;
  paid?: boolean;
  createdAt: Date | string;
  /** base href — e.g. "/staff/submissions" or "/admin/submissions" */
  href: string;
}

function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const h = d.getHours() % 12 || 12;
  const m = pad(d.getMinutes());
  const ampm = d.getHours() >= 12 ? "PM" : "AM";
  return `${h}:${m} ${ampm}`;
}

export function SubmissionRow({ s }: { s: SubmissionRowData }) {
  const dateLabel = formatDate(s.createdAt);
  const displayStart = s.editedStartTime ?? s.startTime;
  const timeRange =
    displayStart
      ? s.endTime
        ? `${fmtTime(displayStart)} – ${fmtTime(s.endTime)}`
        : fmtTime(displayStart)
      : null;

  // Build a 2×2 image preview (max 4 slots)
  const slots = s.images.slice(0, 4);
  const extra = s.images.length > 4 ? s.images.length - 4 : 0;

  return (
    <Link
      href={`${s.href}/${s.id}`}
      className="group flex items-center gap-3 rounded-2xl border border-border bg-background p-3 transition-shadow hover:shadow-sm md:gap-4 md:p-4"
    >
      {/* Image grid — left side */}
      <div className="relative grid shrink-0 grid-cols-2 gap-0.5 overflow-hidden rounded-xl bg-muted"
           style={{ width: 72, height: 72 }}>
        {slots.length === 0 && (
          <div className="col-span-2 row-span-2 flex items-center justify-center text-[10px] text-muted-foreground">
            No img
          </div>
        )}
        {slots.length === 1 && (
          <Image src={slots[0]} alt="" fill className="col-span-2 row-span-2 object-cover" sizes="72px" />
        )}
        {slots.length >= 2 &&
          slots.map((src, i) => (
            <div key={i} className="relative h-full w-full">
              <Image src={src} alt="" fill className="object-cover" sizes="36px" />
            </div>
          ))}
        {extra > 0 && (
          <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 text-xs font-semibold text-white">
            +{extra}
          </span>
        )}
      </div>

      {/* Details — right side */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold text-foreground leading-tight">
            {s.placeOfWork}
          </p>
          <span className="shrink-0 text-[10px] text-muted-foreground">{dateLabel}</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
          {s.vehicleNumber && (
            <span className="text-xs font-medium text-muted-foreground">{s.vehicleNumber}</span>
          )}
          {timeRange && (
            <span className="text-xs text-muted-foreground">{timeRange}</span>
          )}
          {s.userName && (
            <span className="text-xs text-muted-foreground">{s.userName}</span>
          )}
        </div>

        <p className="line-clamp-1 text-xs leading-5 text-foreground/70">
          {s.workDescription}
        </p>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {s.diesel && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              <Fuel className="size-3" />
              {s.dieselAmount != null ? `₹${s.dieselAmount}` : "Diesel"}
            </span>
          )}
          {s.billPhoto && (
            <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              <Receipt className="size-3" /> Bill
            </span>
          )}
          {s.paid && (
            <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-950/40 dark:text-green-400">
              <CheckCircle2 className="size-3" /> Paid
            </span>
          )}
        </div>
      </div>

      {/* Chevron hint */}
      <svg className="size-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
