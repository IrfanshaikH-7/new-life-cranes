"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Plus, Camera, X, Upload } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createStaffAction } from "@/app/actions/users";
import { useUploadThing } from "@/lib/uploadthing-client";

export function CreateStaffDialog() {
  const [open, setOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { startUpload } = useUploadThing("avatar");

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
      setAvatarFile(null);
      setAvatarPreview(null);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setUploading(true);

    try {
      // Upload avatar first if one was picked
      let avatarUrl: string | null = null;
      if (avatarFile) {
        const res = await startUpload([avatarFile]);
        if (!res?.[0]) throw new Error("Avatar upload failed.");
        avatarUrl = res[0].ufsUrl ?? res[0].url;
      }

      // Build FormData from the form element
      const fd = new FormData(formRef.current!);
      if (avatarUrl) fd.set("avatar", avatarUrl);
      else fd.delete("avatar");

      setUploading(false);

      // Call the server action directly inside a transition
      startTransition(async () => {
        const result = await createStaffAction(undefined, fd);
        if (result?.success) {
          formRef.current?.reset();
          if (avatarPreview) URL.revokeObjectURL(avatarPreview);
          setAvatarFile(null);
          setAvatarPreview(null);
          setOpen(false);
        } else if (result?.message) {
          setError(result.message);
        } else if (result?.errors) {
          const first = Object.values(result.errors).flat()[0];
          if (first) setError(first);
        }
      });
    } catch (err) {
      setUploading(false);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const busy = uploading || isPending;

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
          <DialogDescription>
            The new member can sign in immediately with this email and password.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex size-16 items-center justify-center overflow-hidden rounded-full border border-dashed border-border bg-muted text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
                aria-label="Upload profile image"
              >
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Camera className="size-5" />
                )}
              </button>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-foreground text-background shadow-sm hover:bg-foreground/90"
                  aria-label="Remove"
                >
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
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="jane@company.com" required />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Temporary password</Label>
            <Input
              id="password"
              name="password"
              type="text"
              placeholder="At least 8 chars, 1 letter, 1 number"
              required
            />
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {uploading ? (
                <><Upload className="size-4 animate-pulse" />Uploading…</>
              ) : isPending ? (
                <><Loader2 className="size-4 animate-spin" />Creating…</>
              ) : (
                "Create staff"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
