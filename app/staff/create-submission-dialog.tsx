"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, Plus, X, Fuel, Upload } from "lucide-react";
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
import { createSubmissionAction } from "@/app/actions/submissions";

const MAX_IMAGES = 4;

function nowLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface Preview { file: File; objectUrl: string }

export function CreateSubmissionDialog() {
  const [open, setOpen] = useState(false);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [vehicle, setVehicle] = useState("");
  const [diesel, setDiesel] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { startUpload } = useUploadThing("sitePhotos");

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    const remaining = MAX_IMAGES - previews.length;
    if (!files.length || remaining <= 0) return;
    setPreviews(prev => [
      ...prev,
      ...files.filter(f => f.type.startsWith("image/")).slice(0, remaining)
        .map(f => ({ file: f, objectUrl: URL.createObjectURL(f) })),
    ]);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      previews.forEach(p => URL.revokeObjectURL(p.objectUrl));
      setPreviews([]); setVehicle(""); setDiesel(false); setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (previews.length === 0) { setError("Add at least one photo."); return; }
    if (!vehicle) { setError("Select a vehicle."); return; }

    setUploading(true);
    try {
      const res = await startUpload(previews.map(p => p.file));
      if (!res) throw new Error("Upload failed.");
      const urls = res.map(r => r.ufsUrl ?? r.url);

      const fd = new FormData(formRef.current!);
      fd.delete("images");
      urls.forEach(url => fd.append("images", url));
      fd.set("vehicleNumber", vehicle);
      fd.set("diesel", diesel ? "yes" : "no");

      setUploading(false);

      startTransition(async () => {
        const result = await createSubmissionAction(undefined, fd);
        if (result?.success) {
          previews.forEach(p => URL.revokeObjectURL(p.objectUrl));
          setPreviews([]); setVehicle(""); setDiesel(false);
          formRef.current?.reset();
          setOpen(false);
        } else {
          const msg = result?.message
            ?? Object.values(result?.errors ?? {}).flat()[0]
            ?? "Something went wrong.";
          setError(msg);
        }
      });
    } catch (err) {
      setUploading(false);
      setError(err instanceof Error ? err.message : "Upload failed.");
    }
  };

  const busy = uploading || isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-full">
          <Plus className="size-4" /> New submission
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[85svh] w-[calc(100vw-1.5rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:w-full">
        <DialogHeader className="shrink-0 px-5 pt-5 pb-4">
          <DialogTitle>Log your work</DialogTitle>
          <DialogDescription>Fill in the details and add up to {MAX_IMAGES} site photos.</DialogDescription>
        </DialogHeader>
        <Separator />

        <form ref={formRef} onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="flex flex-col gap-5">

              <div className="flex flex-col gap-2">
                <Label>Vehicle</Label>
                <Select value={vehicle} onValueChange={setVehicle} required>
                  <SelectTrigger><SelectValue placeholder="Select vehicle…" /></SelectTrigger>
                  <SelectContent>
                    {VEHICLE_NUMBERS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="placeOfWork">Place of work</Label>
                <Input id="placeOfWork" name="placeOfWork" placeholder="e.g. Site A, Tower 3" required />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="workDescription">Work description</Label>
                <Textarea id="workDescription" name="workDescription" placeholder="Briefly describe the work performed today…" rows={3} required />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="startTime">
                  Start time <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">defaults to save time</span>
                </Label>
                <Input id="startTime" name="startTime" type="datetime-local" defaultValue={nowLocal()} />
              </div>

              <Separator />

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Fuel className="size-4 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium leading-none">Diesel filled</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">Toggle if diesel was filled today</p>
                    </div>
                  </div>
                  <Switch checked={diesel} onCheckedChange={setDiesel} aria-label="Diesel filled" />
                </div>
                {diesel && (
                  <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                    <Label htmlFor="dieselAmount" className="text-amber-700 dark:text-amber-400">Amount paid (₹)</Label>
                    <Input id="dieselAmount" name="dieselAmount" type="number" min="1" step="0.01" placeholder="e.g. 2500"
                      className="border-amber-200 bg-white focus-visible:ring-amber-400 dark:border-amber-900/40 dark:bg-transparent" required />
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label>Site photos</Label>
                  <span className="text-xs text-muted-foreground">{previews.length} / {MAX_IMAGES}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {previews.map((p, i) => (
                    <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.objectUrl} alt="" className="h-full w-full object-cover" />
                      <button type="button" onClick={() => {
                        URL.revokeObjectURL(p.objectUrl);
                        setPreviews(prev => prev.filter((_, j) => j !== i));
                      }}
                        className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                        aria-label="Remove">
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  {previews.length < MAX_IMAGES && (
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-muted/40 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                      <ImagePlus className="size-5" />
                      <span className="text-[10px] font-medium">Add photo</span>
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleFiles} />
              </div>

              {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>
              )}
            </div>
          </div>

          <Separator />
          <DialogFooter className="shrink-0 px-5 py-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={busy || !vehicle}>
              {uploading ? <><Upload className="size-4 animate-pulse" />Uploading…</>
                : isPending ? <><Loader2 className="size-4 animate-spin" />Saving…</>
                : "Save submission"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
