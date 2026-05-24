"use client";

import { useActionState, useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  adminUpdateSubmissionAction,
  type AdminUpdateState,
} from "@/app/actions/submissions";

interface PaidFormProps {
  submissionId: string;
  initialPaid: boolean;
  initialRemark: string | null;
}

export function PaidForm({ submissionId, initialPaid, initialRemark }: PaidFormProps) {
  const [paid, setPaid] = useState(initialPaid);
  const [state, action, pending] = useActionState<AdminUpdateState, FormData>(
    adminUpdateSubmissionAction,
    undefined
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="submissionId" value={submissionId} />
      <input type="hidden" name="paid" value={paid ? "true" : "false"} />

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className={`size-4 ${paid ? "text-green-500" : "text-muted-foreground"}`} />
          <div>
            <Label className="text-sm font-medium">Mark as paid</Label>
            <p className="text-xs text-muted-foreground">Toggle to mark this submission as paid</p>
          </div>
        </div>
        <Switch checked={paid} onCheckedChange={setPaid} aria-label="Mark as paid" />
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        <Label htmlFor="adminRemark">Admin remark</Label>
        <Textarea
          id="adminRemark"
          name="adminRemark"
          defaultValue={initialRemark ?? ""}
          placeholder="Add a note visible to the staff member…"
          rows={3}
        />
      </div>

      {state?.success && (
        <p className="text-xs text-green-600 dark:text-green-400">Saved successfully.</p>
      )}
      {state?.message && !state.success && (
        <p className="text-xs text-destructive">{state.message}</p>
      )}

      <Button type="submit" disabled={pending} className="self-end">
        {pending ? <><Loader2 className="size-4 animate-spin" />Saving…</> : "Save"}
      </Button>
    </form>
  );
}
