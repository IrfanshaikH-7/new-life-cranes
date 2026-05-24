"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Loader2, Plus, Camera, X, Upload } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createStaffAction, type CreateStaffState } from "@/app/actions/users";
import { useUploadThing } from "@/lib/uploadthing-client";

export function CreateStaffDialog() {
  const [open, setOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [state, action, pending] = useActionState<CreateStaffState, FormData>(createStaffAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { startUpload } = useUploadThing("avatar");

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setAvatarFile(null);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
      setUploadError(null);
      setOpen(false);
    }
  }, [state]);

  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const removeAvatar = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      formRef.current?.reset();
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarFile(null); setAvatarPreview(null); setUploadError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadError(null);
    setUploading(true);
    try {
      let avatarUrl: string | null = null;
      if (avatarFile) {
        const res = await startUpload([avatarFile]);
        if (!res?.[0]) throw new Error("Avatar upload failed.");
        avatarUrl = res[0].ufsUrl ?? res[0].url;
      }
      const fd = new FormData(e.currentTarget);
      if (avatarUrl) fd.set("avatar", avatarUrl);
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
        <Button size="sm" className="rounded-full">
          <Plus className="size-4" /> Add staff
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a staff account</DialogTitle>
          <DialogDescription>The new member can sign in immediately with this email and password.</DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <button type="button" onClick={() => fileRef.current?.click()}
                className="flex size-16 items-center justify-center overflow-hidden rounded-full border border-dashed border-border bg-muted text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
                aria-label="Upload profile image">
                {avatarPreview
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                  : <Camera className="size-5" />}
              </button>
              {avatarPreview && (
                <button type="button" onClick={removeAvatar}
                  className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-foreground text-background shadow-sm hover:bg-foreground/90"
                  aria-label="Remove">
                  <X className="size-3" />
                </button>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Profile image</p>
              <p className="text-[11px] text-muted-foreground">Optional. Square, under 2 MB.</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarPick} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" placeholder="Jane Doe" required />
            {state?.errors?.name && <p className="text-xs text-destructive">{state.errors.name[0]}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="jane@company.com" required />
            {state?.errors?.email && <p className="text-xs text-destructive">{state.errors.email[0]}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Temporary password</Label>
            <Input id="password" name="password" type="text" placeholder="At least 8 chars, 1 letter, 1 number" required />
            {state?.errors?.password && <p className="text-xs text-destructive">{state.errors.password[0]}</p>}
          </div>

          {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
          {state?.message && !state.success && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">{state.message}</div>
          )}

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>
              {uploading ? <><Upload className="size-4 animate-pulse" />Uploading…</>
                : pending ? <><Loader2 className="size-4 animate-spin" />Creating…</>
                : "Create staff"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
