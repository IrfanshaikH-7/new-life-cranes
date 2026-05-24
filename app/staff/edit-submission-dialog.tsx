"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Pencil, Receipt, X, Fuel, Upload } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { VEHICLE_NUMBERS } from "@/lib/types";
import { useUploadThing } from "@/lib/uploadthing-client";
import { editSubmissionAction, type SubmissionState } from "@/app/actions/submissions";

const MAX_IMAGES = 4;

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
  return d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
}

/** A slot is either an already-uploaded URL or a local File pending upload */
type Slot = { kind: "url"; url: string } | { kind: "file"; file: File; objectUrl: string };

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
  const [slots, setSlots] = useState<Slot[]>(submission.images.map(url => ({ kind: "url", url })));
  const [billSlot, setBillSlot] = useState<Slot | null>(
    submission.billPhoto ? { kind: "url", url: submission.billPhoto } : null
  );
  const [diesel, setDiesel] = useState(submission.diesel);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [billError, setBillError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const billInputRef = useRef<HTMLInputElement>(null);

  const [state, action, pending] = useActionState<SubmissionState, FormData>(editSubmissionAction, undefined);
  const { startUpload: uploadSite } = useUploadThing("sitePhotos");
  const { startUpload: uploadBill } = useUploadThing("billPhoto");

  useEffect(() => {
    if (state?.success) { setUploadError(null); setBillError(null); setOpen(false); }
  }, [state]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setVehicle(submission.vehicleNumber);
      setSlots(submission.images.map(url => ({ kind: "url", url })));
      setBillSlot(submission.billPhoto ? { kind: "url", url: submission.billPhoto } : null);
      setDiesel(submission.diesel);
      setUploadError(null); setBillError(null);
    }
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    const remaining = MAX_IMAGES - slots.length;
    if (!files.length || remaining <= 0) return;
    setSlots(prev => [
      ...prev,
      ...files.filter(f => f.type.startsWith("image/")).slice(0, remaining)
        .map(f => ({ kind: "file" as const, file: f, objectUrl: URL.createObjectURL(f) })),
    ]);
  };

  const handleBillFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) { setBillError("Must be an image."); return; }
    setBillSlot({ kind: "file", file, objectUrl: URL.createObjectURL(file) });
  };

  const removeSlot = (i: number) => {
    const s = slots[i];
    if (s.kind === "file") URL.revokeObjectURL(s.objectUrl);
    setSlots(p => p.filter((_, j) => j !== i));
  };

  const slotPreview = (s: Slot) => s.kind === "url" ? s.url : s.objectUrl;
  const billPreview = billSlot ? slotPreview(billSlot) : null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadError(null); setBillError(null);
    setUploading(true);

    try {
      // Upload any new site photos
      const newFiles = slots.filter((s): s is Extract<Slot, { kind: "file" }> => s.kind === "file");
      let finalUrls = slots.filter(s => s.kind === "url").map(s => (s as Extract<Slot, { kind: "url" }>).url);

      if (newFiles.length > 0) {
        const res = await uploadSite(newFiles.map(s => s.file));
        if (!res) throw new Error("Photo upload failed.");
        finalUrls = [...finalUrls, ...res.map(r => r.ufsUrl ?? r.url)];
      }

      // Upload bill photo if new
      let finalBill: string | null = billSlot?.kind === "url" ? billSlot.url : null;
      if (billSlot?.kind === "file") {
        const res = await uploadBill([billSlot.file]);
        if (!res?.[0]) throw new Error("Bill upload failed.");
        finalBill = res[0].ufsUrl ?? res[0].url;
      }

      const fd = new FormData(e.currentTarget);
      fd.delete("images");
      finalUrls.forEach(url => fd.append("images", url));
      fd.set("billPhoto", finalBill ?? "");
      fd.set("vehicleNumber", vehicle);
      fd.set("diesel", diesel ? "yes" : "no");
      action(fd);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const busy = uploading || pending;

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
          <DialogDescription>Original start time is preserved — edits go to a separate field.</DialogDescription>
        </DialogHeader>
        <Separator />

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <input type="hidden" name="submissionId" value={submission.id} />

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="flex flex-col gap-5">

              <div className="flex flex-col gap-2">
                <Label>Vehicle</Label>
                <Select value={vehicle} onValueChange={setVehicle}>
                  <SelectTrigger><SelectValue placeholder="Select vehicle…" /></SelectTrigger>
                  <SelectContent>
                    {VEHICLE_NUMBERS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-place">Place of work</Label>
                <Input id="edit-place" name="placeOfWork" defaultValue={submission.placeOfWork} required />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-desc">Work description</Label>
                <Textarea id="edit-desc" name="workDescription" defaultValue={submission.workDescription} rows={3} required />
              </div>

              <Separator />

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground">Original start time <span className="text-[10px] font-normal">(read-only)</span></Label>
                  <div className="flex h-11 items-center rounded-xl border border-border bg-muted/50 px-3.5 text-sm text-muted-foreground">
                    {fmtReadable(submission.startTime)}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-start">Edited start time</Label>
                  <Input id="edit-start" name="editedStartTime" type="datetime-local" defaultValue={toDatetimeLocal(submission.editedStartTime ?? submission.startTime)} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-end">End time</Label>
                  <Input id="edit-end" name="endTime" type="datetime-local" defaultValue={toDatetimeLocal(submission.endTime)} />
                </div>
              </div>

              <Separator />

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
                    <Label htmlFor="edit-diesel" className="text-amber-700 dark:text-amber-400">Amount paid (₹)</Label>
                    <Input id="edit-diesel" name="dieselAmount" type="number" min="1" step="0.01"
                      defaultValue={submission.dieselAmount ?? ""} placeholder="e.g. 2500"
                      className="border-amber-200 bg-white focus-visible:ring-amber-400 dark:border-amber-900/40 dark:bg-transparent" required />
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label>Site photos</Label>
                  <span className="text-xs text-muted-foreground">{slots.length} / {MAX_IMAGES}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {slots.map((s, i) => (
                    <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={slotPreview(s)} alt="" className="h-full w-full object-cover" />
                      <button type="button" onClick={() => removeSlot(i)}
                        className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                        aria-label="Remove"><X className="size-3.5" /></button>
                    </div>
                  ))}
                  {slots.length < MAX_IMAGES && (
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-muted/40 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                      <ImagePlus className="size-5" />
                      <span className="text-[10px] font-medium">Add photo</span>
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleFiles} />
                {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Receipt className="size-4 text-muted-foreground" />
                  <Label>Bill / receipt photo</Label>
                  <span className="text-[11px] text-muted-foreground">(optional)</span>
                </div>
                {billPreview ? (
                  <div className="group relative overflow-hidden rounded-xl border border-border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={billPreview} alt="Bill" className="max-h-48 w-full object-contain" />
                    <button type="button" onClick={() => setBillSlot(null)}
                      className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Remove bill photo"><X className="size-3.5" /></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => billInputRef.current?.click()}
                    className="flex h-20 w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-muted/40 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                    <Receipt className="size-5" />
                    <span className="text-xs font-medium">Upload bill photo</span>
                  </button>
                )}
                <input ref={billInputRef} type="file" accept="image/*" hidden onChange={handleBillFile} />
                {billError && <p className="text-xs text-destructive">{billError}</p>}
              </div>

              {state?.message && !state.success && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{state.message}</div>
              )}
            </div>
          </div>

          <Separator />
          <DialogFooter className="shrink-0 px-5 py-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>
              {uploading ? <><Upload className="size-4 animate-pulse" />Uploading…</>
                : pending ? <><Loader2 className="size-4 animate-spin" />Saving…</>
                : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
