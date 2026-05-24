"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  images: string[];
  createdAt: Date | string;
}

interface SubmissionCardProps {
  submission: SubmissionCardData;
  showAuthor?: boolean;
}

export function SubmissionCard({
  submission,
  showAuthor = false,
}: SubmissionCardProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const dateLabel = formatDate(submission.createdAt);
  const cover = submission.images[0];
  const extras = submission.images.length - 1;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setActiveIndex(0);
          setOpen(true);
        }}
        className="group flex w-full flex-col gap-2 overflow-hidden rounded-2xl border border-border bg-background p-2 text-left transition-shadow hover:shadow-sm md:gap-3 md:rounded-3xl md:p-3"
      >
        <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-muted md:rounded-2xl">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt=""
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              No image
            </div>
          )}
          {extras > 0 && (
            <span className="absolute bottom-2 right-2 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-medium text-foreground shadow-sm backdrop-blur">
              +{extras}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-0.5 px-1 pb-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-foreground">
              {submission.placeOfWork}
            </p>
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {dateLabel}
            </span>
          </div>
          {showAuthor && submission.userName && (
            <p className="truncate text-[11px] text-muted-foreground">
              {submission.userName}
            </p>
          )}
          <p className="line-clamp-2 text-xs leading-5 text-foreground/80">
            {submission.workDescription}
          </p>
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92svh] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto p-0 sm:w-full">
          <div className="flex flex-col">
            <div className="relative aspect-4/3 w-full overflow-hidden bg-muted sm:aspect-video">
              {submission.images[activeIndex] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={submission.images[activeIndex]}
                  alt=""
                  className="h-full w-full object-contain"
                />
              )}

              {submission.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveIndex((i) =>
                        i === 0 ? submission.images.length - 1 : i - 1
                      );
                    }}
                    className="absolute left-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm hover:bg-background"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveIndex((i) =>
                        i === submission.images.length - 1 ? 0 : i + 1
                      );
                    }}
                    className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm hover:bg-background"
                    aria-label="Next image"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
                    {submission.images.map((_, i) => (
                      <span
                        key={i}
                        className={cn(
                          "size-1.5 rounded-full transition-colors",
                          i === activeIndex
                            ? "bg-foreground"
                            : "bg-foreground/30"
                        )}
                      />
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
                    className={cn(
                      "relative size-14 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                      i === activeIndex
                        ? "border-foreground"
                        : "border-transparent opacity-70 hover:opacity-100"
                    )}
                    aria-label={`Image ${i + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <DialogTitle className="truncate text-base">
                    {submission.placeOfWork}
                  </DialogTitle>
                  {showAuthor && submission.userName && (
                    <DialogDescription className="mt-0.5 text-xs">
                      Submitted by {submission.userName}
                    </DialogDescription>
                  )}
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {dateLabel}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">
                {submission.workDescription}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

