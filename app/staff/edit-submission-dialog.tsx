"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { ImagePlus, Loader2, Pencil, Receipt, X, Fuel } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { VEHICLE_NUMBERS } from "@/lib/types";
import {
  editSubmissionAction,
  type SubmissionState,
} from "@/app/actions/submissions";

const MAX_IMAGES = 4;
const MAX_BYTES = 2_500_000;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fmtReadable(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString([], {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

export interface EditableSubmission {
  id: string;
  placeOfWork: string;
  workDescription: string;
  vehicleNumber: string;
  startTime: string;
  editedStartTime: string | null;
  endTime: string | null;
  diesel: boolean;
  dieselAmount: number | null;
  images: string[];
  billPhoto: string | null;
}

export function EditSubmissionDialog({ submission }: { submission: EditableSubmission }) {
  const [open, setOpen] = useState(false);
  const [vehicle, setVehicle] = useState(submission.vehicleNumber);
  const [images, setImages] = useState<string[]>(submission.images);
  const [billPhoto, setBillPhoto] = useState<string | null>(submission.billPhoto);
  const [diesel, setDiesel] = useState(submission.diesel);
  const [localError, setLocalError] = useState<string | null>(null);
  const [billError, setBillError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const billInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [state, action, pending] = useActionState<SubmissionState, FormData>(
    editSubmissionAction,
    undefined
  );

  useEffect(() => {
    if (state?.success) { setLocalError(null); setBillError(null); setOpen(false); }
  }, [state]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setVehicle(submission.vehicleNumber);
      setImages(submission.images);
      setBillPhoto(submission.billPhoto);
      setDiesel(submission.diesel);
      setLocalError(null);
      setBillError(null);
    }
  };

  const handleFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    setLocalError(null);
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) { setLocalError(`Maximum ${MAX_IMAGES} images.`); return; }
    try {
      const urls = await Promise.all(
        files.slice(0, remaining).map(async (f) => {
          if (!f.type.startsWith("image/")) throw new Error("Only image files are allowed.");
          const url = await fileToDataUrl(f);
          if (url.length > MAX_BYTES) throw new Error(`"${f.name}" is too large (max 2 MB).`);
          return url;
        })
      );
      setImages((prev) => [...prev, ...urls].slice(0, MAX_IMAGES));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Failed to read file.");
    }
  };

  const handleBill = async (e: ChangeEvent<HTMLInputElement>) => {
    setBillError(null);
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { setBillError("Bill photo must be an image."); return; }
    try {
      const url = await fileToDataUrl(file);
      if (url.length > MAX_BYTES) { setBillError("Bill photo is too large (max 2 MB)."); return; }
      setBillPhoto(url);
    } catch { setBillError("Could not read the file."); }
  };

  const displayStartTime = toDatetimeLocal(submission.editedStartTime ?? submission.startTime);
  const displayEndTime = toDatetimeLocal(submission.endTime);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 rounded-full" aria-label="Edit submission">
          <Pencil className="size-3.5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[85svh] w-[calc(100vw-1.5rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:w-full">
        <DialogHeader className="shrink-0 px-5 pt-5 pb-4">
          <DialogTitle>Edit submission</DialogTitle>
          <DialogDescription>
            Original start time is preserved — edits go to a separate field.
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <form ref={formRef} action={action} className="flex min-h-0 flex-1 flex-col">
          <input type="hidden" name="submissionId" value={submission.id} />
          <input type="hidden" name="vehicleNumber" value={vehicle} />
          <input type="hidden" name="diesel" value={diesel ? "yes" : "no"} />
          {images.map((src, i) => <input key={i} type="hidden" name="images" value={src} />)}
          <input type="hidden" name="billPhoto" value={billPhoto ?? ""} />

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="flex flex-col gap-5">

              {/* Vehicle */}
              <div className="flex flex-col gap-2">
                <Label>Vehicle</Label>
                <Select value={vehicle} onValueChange={setVehicle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle…" />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_NUMBERS.map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Place of work */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-place">Place of work</Label>
                <Input id="edit-place" name="placeOfWork" defaultValue={submission.placeOfWork} required />
              </div>

              {/* Work description */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-desc">Work description</Label>
                <Textarea id="edit-desc" name="workDescription" defaultValue={submission.workDescription} rows={3} required />
              </div>

              <Separator />

              {/* Time fields */}
              <div className="flex flex-col gap-4">
                {/* Original start — read-only */}
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground">
                    Original start time
                    <span className="ml-1.5 text-[10px] font-normal">(read-only)</span>
                  </Label>
                  <div className="flex h-11 items-center rounded-xl border border-border bg-muted/50 px-3.5 text-sm text-muted-foreground">
                    {fmtReadable(submission.startTime)}
                  </div>
                </div>

                {/* Edited start */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-start">Edited start time</Label>
                  <Input id="edit-start" name="editedStartTime" type="datetime-local" defaultValue={displayStartTime} />
                </div>

                {/* End time */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-end">End time</Label>
                  <Input id="edit-end" name="endTime" type="datetime-local" defaultValue={displayEndTime} />
                </div>
              </div>

              <Separator />

              {/* Diesel */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Fuel className="size-4 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium leading-none">Diesel filled</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">Toggle if diesel was filled</p>
                    </div>
                  </div>
                  <Switch checked={diesel} onCheckedChange={setDiesel} aria-label="Diesel filled" />
                </div>

                {diesel && (
                  <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                    <Label htmlFor="edit-diesel" className="text-amber-700 dark:text-amber-400">
                      Amount paid (₹)
                    </Label>
                    <Input
                      id="edit-diesel"
                      name="dieselAmount"
                      type="number"
                      min="1"
                      step="0.01"
                      defaultValue={submission.dieselAmount ?? ""}
                      placeholder="e.g. 2500"
                      className="border-amber-200 bg-white focus-visible:ring-amber-400 dark:border-amber-900/40 dark:bg-transparent"
                      required
                    />
                  </div>
                )}
              </div>

              <Separator />

              {/* Work photos */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label>Site photos</Label>
                  <span className="text-xs text-muted-foreground">{images.length} / {MAX_IMAGES}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {images.map((src, i) => (
                    <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                        className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                        aria-label="Remove"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  {images.length < MAX_IMAGES && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-muted/40 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <ImagePlus className="size-5" />
                      <span className="text-[10px] font-medium">Add photo</span>
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleFiles} />
                {localError && <p className="text-xs text-destructive">{localError}</p>}
              </div>

              {/* Bill photo */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Receipt className="size-4 text-muted-foreground" />
                  <Label>Bill / receipt photo</Label>
                  <span className="text-[11px] text-muted-foreground">(optional)</span>
                </div>

                {billPhoto ? (
                  <div className="group relative overflow-hidden rounded-xl border border-border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={billPhoto} alt="Bill" className="max-h-48 w-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setBillPhoto(null)}
                      className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Remove bill photo"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => billInputRef.current?.click()}
                    className="flex h-20 w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-muted/40 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Receipt className="size-5" />
                    <span className="text-xs font-medium">Upload bill photo</span>
                  </button>
                )}
                <input ref={billInputRef} type="file" accept="image/*" hidden onChange={handleBill} />
                {billError && <p className="text-xs text-destructive">{billError}</p>}
              </div>

              {state?.message && !state.success && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {state.message}
                </div>
              )}
            </div>
          </div>

          <Separator />

          <DialogFooter className="shrink-0 px-5 py-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>
              {pending ? <><Loader2 className="size-4 animate-spin" />Saving…</> : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
