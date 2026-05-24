"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Fuel, Receipt } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn, formatDate } from "@/lib/utils";

export interface SubmissionCardData {
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
  createdAt: Date | string;
}

interface SubmissionCardProps {
  submission: SubmissionCardData;
  showAuthor?: boolean;
  editAction?: React.ReactNode;
}

function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
}

type Tab = "photos" | "bill";

export function SubmissionCard({ submission, showAuthor = false, editAction }: SubmissionCardProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [tab, setTab] = useState<Tab>("photos");

  const dateLabel = formatDate(submission.createdAt);
  const cover = submission.images[0];
  const extras = submission.images.length - 1;
  const displayStart = submission.editedStartTime ?? submission.startTime;
  const hasBill = !!submission.billPhoto;

  return (
    <>
      <button
        type="button"
        onClick={() => { setActiveIndex(0); setTab("photos"); setOpen(true); }}
        className="group flex w-full flex-col gap-2 overflow-hidden rounded-2xl border border-border bg-background p-2 text-left transition-shadow hover:shadow-sm md:gap-3 md:rounded-3xl md:p-3"
      >
        <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-muted md:rounded-2xl">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No image</div>
          )}
          {extras > 0 && (
            <span className="absolute bottom-2 right-2 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-medium text-foreground shadow-sm backdrop-blur">
              +{extras}
            </span>
          )}
          {submission.diesel && (
            <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
              <Fuel className="size-3" /> Diesel
            </span>
          )}
          {hasBill && (
            <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-medium text-foreground shadow-sm backdrop-blur">
              <Receipt className="size-3" /> Bill
            </span>
          )}
        </div>
        <div className="flex flex-col gap-0.5 px-1 pb-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{submission.placeOfWork}</p>
            <span className="shrink-0 text-[10px] text-muted-foreground">{dateLabel}</span>
          </div>
          {submission.vehicleNumber && (
            <p className="truncate text-[11px] font-medium text-muted-foreground">{submission.vehicleNumber}</p>
          )}
          {showAuthor && submission.userName && (
            <p className="truncate text-[11px] text-muted-foreground">{submission.userName}</p>
          )}
          <p className="line-clamp-2 text-xs leading-5 text-foreground/80">{submission.workDescription}</p>
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92svh] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto p-0 sm:w-full">
          <div className="flex flex-col">

            {/* Tab bar — only shown when bill photo exists */}
            {hasBill && (
              <div className="flex shrink-0 border-b border-border">
                {(["photos", "bill"] as Tab[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors",
                      tab === t
                        ? "border-b-2 border-foreground text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t === "photos" ? (
                      <><span>Photos</span><span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">{submission.images.length}</span></>
                    ) : (
                      <><Receipt className="size-3.5" /><span>Bill</span></>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Photos tab */}
            {tab === "photos" && (
              <>
                <div className="relative aspect-4/3 w-full overflow-hidden bg-muted sm:aspect-video">
                  {submission.images[activeIndex] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={submission.images[activeIndex]} alt="" className="h-full w-full object-contain" />
                  )}
                  {submission.images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setActiveIndex((i) => i === 0 ? submission.images.length - 1 : i - 1); }}
                        className="absolute left-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm hover:bg-background"
                        aria-label="Previous"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setActiveIndex((i) => i === submission.images.length - 1 ? 0 : i + 1); }}
                        className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm hover:bg-background"
                        aria-label="Next"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
                        {submission.images.map((_, i) => (
                          <span key={i} className={cn("size-1.5 rounded-full transition-colors", i === activeIndex ? "bg-foreground" : "bg-foreground/30")} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
                {submission.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto px-4 pt-3 scrollbar-none">
                    {submission.images.map((src, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveIndex(i)}
                        className={cn("relative size-14 shrink-0 overflow-hidden rounded-lg border-2 transition-colors", i === activeIndex ? "border-foreground" : "border-transparent opacity-70 hover:opacity-100")}
                        aria-label={`Image ${i + 1}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Bill tab */}
            {tab === "bill" && hasBill && (
              <div className="flex items-center justify-center bg-muted p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={submission.billPhoto!}
                  alt="Bill"
                  className="max-h-[55svh] w-full object-contain"
                />
              </div>
            )}

            {/* Details */}
            <div className="flex flex-col gap-3 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <DialogTitle className="truncate text-base">{submission.placeOfWork}</DialogTitle>
                  {showAuthor && submission.userName && (
                    <DialogDescription className="mt-0.5 text-xs">
                      Submitted by {submission.userName}
                    </DialogDescription>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">{dateLabel}</span>
                  {editAction}
                </div>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                {submission.vehicleNumber && (
                  <span><span className="font-medium text-foreground">Vehicle:</span> {submission.vehicleNumber}</span>
                )}
                {displayStart && (
                  <span><span className="font-medium text-foreground">Start:</span> {fmtTime(displayStart)}</span>
                )}
                {submission.endTime && (
                  <span><span className="font-medium text-foreground">End:</span> {fmtTime(submission.endTime)}</span>
                )}
                {submission.diesel && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <Fuel className="size-3" />
                    <span className="font-medium">Diesel:</span>
                    {submission.dieselAmount != null ? ` ₹${submission.dieselAmount}` : " Yes"}
                  </span>
                )}
              </div>

              <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">{submission.workDescription}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
