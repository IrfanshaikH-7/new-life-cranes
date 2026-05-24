"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: string[];
  billPhoto?: string | null;
}

type Tab = "photos" | "bill";

export function ImageGallery({ images, billPhoto }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [tab, setTab] = useState<Tab>("photos");
  const hasBill = !!billPhoto;

  return (
    <div className="flex flex-col">
      {/* Tab bar */}
      {hasBill && (
        <div className="flex border-b border-border">
          {(["photos", "bill"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors",
                tab === t
                  ? "border-b-2 border-foreground text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "photos" ? (
                <>Photos <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px]">{images.length}</span></>
              ) : (
                <>Bill / Receipt</>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Photos */}
      {tab === "photos" && (
        <div className="flex flex-col">
          <div className="relative aspect-video w-full overflow-hidden bg-muted">
            {images[activeIndex] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={images[activeIndex]}
                alt=""
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No images
              </div>
            )}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveIndex((i) => (i === 0 ? images.length - 1 : i - 1))}
                  className="absolute left-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md hover:bg-background"
                  aria-label="Previous"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveIndex((i) => (i === images.length - 1 ? 0 : i + 1))}
                  className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md hover:bg-background"
                  aria-label="Next"
                >
                  <ChevronRight className="size-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveIndex(i)}
                      className={cn(
                        "size-2 rounded-full transition-all",
                        i === activeIndex ? "bg-foreground scale-125" : "bg-foreground/30 hover:bg-foreground/60"
                      )}
                      aria-label={`Go to image ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto bg-muted/30 px-4 py-3 scrollbar-none">
              {images.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className={cn(
                    "relative size-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all",
                    i === activeIndex
                      ? "border-foreground shadow-sm"
                      : "border-transparent opacity-60 hover:opacity-100"
                  )}
                  aria-label={`Image ${i + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bill */}
      {tab === "bill" && hasBill && (
        <div className="flex min-h-64 items-center justify-center bg-muted/30 p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={billPhoto!}
            alt="Bill"
            className="max-h-[60svh] w-full object-contain"
          />
        </div>
      )}
    </div>
  );
}
