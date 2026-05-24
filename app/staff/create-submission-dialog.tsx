"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { ImagePlus, Loader2, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createSubmissionAction,
  type SubmissionState,
} from "@/app/actions/submissions";

const MAX_IMAGES = 4;
const MAX_BYTES = 2_500_000; // ~2 MB per image after base64

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function CreateSubmissionDialog() {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [state, action, pending] = useActionState<SubmissionState, FormData>(
    createSubmissionAction,
    undefined
  );

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setImages([]);
      setLocalError(null);
      setOpen(false);
    }
  }, [state]);

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    setLocalError(null);
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      setLocalError(`Maximum ${MAX_IMAGES} images.`);
      return;
    }

    const accepted = files.slice(0, remaining);
    try {
      const dataUrls = await Promise.all(
        accepted.map(async (f) => {
          if (!f.type.startsWith("image/")) {
            throw new Error("Only image files are allowed.");
          }
          const url = await fileToDataUrl(f);
          if (url.length > MAX_BYTES) {
            throw new Error(
              `“${f.name}” is too large. Each image must be under 2 MB.`
            );
          }
          return url;
        })
      );
      setImages((prev) => [...prev, ...dataUrls].slice(0, MAX_IMAGES));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Failed to read file.");
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      formRef.current?.reset();
      setImages([]);
      setLocalError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-full">
          <Plus className="size-4" />
          New submission
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Log your work</DialogTitle>
          <DialogDescription>
            Add up to {MAX_IMAGES} photos with the place of work and a short
            description.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="placeOfWork">Place of work</Label>
            <Input
              id="placeOfWork"
              name="placeOfWork"
              placeholder="e.g. Site A, Tower 3"
              required
            />
            {state?.errors?.placeOfWork && (
              <p className="text-xs text-destructive">
                {state.errors.placeOfWork[0]}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="workDescription">Work description</Label>
            <Textarea
              id="workDescription"
              name="workDescription"
              placeholder="Briefly describe the work performed today…"
              rows={4}
              required
            />
            {state?.errors?.workDescription && (
              <p className="text-xs text-destructive">
                {state.errors.workDescription[0]}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>
                Photos{" "}
                <span className="text-muted-foreground">
                  ({images.length}/{MAX_IMAGES})
                </span>
              </Label>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {images.map((src, i) => (
                <div
                  key={i}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`Selected ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 shadow-sm transition-opacity hover:bg-background group-hover:opacity-100"
                    aria-label="Remove image"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}

              {images.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-muted/40 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <ImagePlus className="size-5" />
                  <span className="text-[10px] font-medium">Add</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={handleFiles}
            />

            {/* hidden inputs carry the base64 strings to the server action */}
            {images.map((src, i) => (
              <input key={i} type="hidden" name="images" value={src} />
            ))}

            {localError && (
              <p className="text-xs text-destructive">{localError}</p>
            )}
            {state?.errors?.images && (
              <p className="text-xs text-destructive">
                {state.errors.images[0]}
              </p>
            )}
          </div>

          {state?.message && !state.success && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {state.message}
            </div>
          )}

          <DialogFooter className="mt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save submission"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
