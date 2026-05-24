"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/mongodb";
import { requireRole } from "@/lib/auth";
import { VEHICLE_NUMBERS } from "@/lib/types";
import type { SubmissionDoc } from "@/lib/types";

const ImageSchema = z
  .string()
  .startsWith("data:image/", { message: "Invalid image data." })
  .max(2_500_000, { message: "Image is too large (max ~2 MB each)." });

const OptionalImageSchema = ImageSchema.optional().or(z.literal(""));

const TimeSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, { message: "Invalid time format." });

// ─── Create ──────────────────────────────────────────────────────────────────

const CreateSchema = z.object({
  placeOfWork: z.string().min(2, { message: "Place of work is required." }).max(120).trim(),
  workDescription: z.string().min(5, { message: "Description must be at least 5 characters." }).max(2000).trim(),
  vehicleNumber: z.enum(VEHICLE_NUMBERS, { message: "Select a valid vehicle." }),
  startTime: TimeSchema.optional(),
  diesel: z.enum(["yes", "no"]),
  dieselAmount: z.coerce
    .number({ invalid_type_error: "Enter a valid amount." })
    .positive({ message: "Amount must be positive." })
    .optional(),
  images: z.array(ImageSchema).min(1, { message: "Add at least one image." }).max(4, { message: "Up to 4 images allowed." }),
});

// ─── Edit ─────────────────────────────────────────────────────────────────────

const EditSchema = z.object({
  submissionId: z.string().min(1),
  placeOfWork: z.string().min(2).max(120).trim(),
  workDescription: z.string().min(5).max(2000).trim(),
  vehicleNumber: z.enum(VEHICLE_NUMBERS, { message: "Select a valid vehicle." }),
  editedStartTime: TimeSchema.optional(),
  endTime: TimeSchema.optional(),
  diesel: z.enum(["yes", "no"]),
  dieselAmount: z.coerce.number().positive().optional(),
  images: z.array(ImageSchema).min(1).max(4),
  billPhoto: OptionalImageSchema,
});

// ─── Admin update ─────────────────────────────────────────────────────────────

const AdminUpdateSchema = z.object({
  submissionId: z.string().min(1),
  paid: z.enum(["true", "false"]),
  adminRemark: z.string().max(1000).trim().optional(),
});

// ─── State type ───────────────────────────────────────────────────────────────

export type SubmissionState =
  | {
      errors?: {
        placeOfWork?: string[];
        workDescription?: string[];
        vehicleNumber?: string[];
        startTime?: string[];
        editedStartTime?: string[];
        endTime?: string[];
        diesel?: string[];
        dieselAmount?: string[];
        images?: string[];
        billPhoto?: string[];
      };
      message?: string;
      success?: boolean;
    }
  | undefined;

export type AdminUpdateState =
  | { message?: string; success?: boolean }
  | undefined;

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function createSubmissionAction(
  _prev: SubmissionState,
  formData: FormData
): Promise<SubmissionState> {
  const session = await requireRole("staff");

  const rawImages = formData.getAll("images").map((v) => String(v));
  const dieselVal = formData.get("diesel") as string;

  const parsed = CreateSchema.safeParse({
    placeOfWork: formData.get("placeOfWork"),
    workDescription: formData.get("workDescription"),
    vehicleNumber: formData.get("vehicleNumber"),
    startTime: formData.get("startTime") || undefined,
    diesel: dieselVal,
    dieselAmount: dieselVal === "yes" ? formData.get("dieselAmount") : undefined,
    images: rawImages,
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const now = new Date();
  const startTime = parsed.data.startTime
    ? new Date(parsed.data.startTime).toISOString()
    : now.toISOString();

  const db = await getDb();
  await db.collection<SubmissionDoc>("submissions").insertOne({
    userId: session.userId,
    userName: session.name,
    placeOfWork: parsed.data.placeOfWork,
    workDescription: parsed.data.workDescription,
    vehicleNumber: parsed.data.vehicleNumber,
    startTime,
    endTime: null,
    editedStartTime: null,
    diesel: parsed.data.diesel === "yes",
    dieselAmount: parsed.data.diesel === "yes" ? (parsed.data.dieselAmount ?? null) : null,
    images: parsed.data.images,
    billPhoto: null,
    paid: false,
    adminRemark: null,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/staff");
  revalidatePath("/staff/submissions");
  revalidatePath("/admin/submissions");
  return { success: true };
}

export async function editSubmissionAction(
  _prev: SubmissionState,
  formData: FormData
): Promise<SubmissionState> {
  const session = await requireRole("staff");

  const rawImages = formData.getAll("images").map((v) => String(v));
  const dieselVal = formData.get("diesel") as string;
  const rawBill = formData.get("billPhoto");

  const parsed = EditSchema.safeParse({
    submissionId: formData.get("submissionId"),
    placeOfWork: formData.get("placeOfWork"),
    workDescription: formData.get("workDescription"),
    vehicleNumber: formData.get("vehicleNumber"),
    editedStartTime: formData.get("editedStartTime") || undefined,
    endTime: formData.get("endTime") || undefined,
    diesel: dieselVal,
    dieselAmount: dieselVal === "yes" ? formData.get("dieselAmount") : undefined,
    images: rawImages,
    billPhoto: rawBill || undefined,
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { ObjectId } = await import("mongodb");
  const db = await getDb();
  const col = db.collection<SubmissionDoc>("submissions");

  const existing = await col.findOne({
    _id: new ObjectId(parsed.data.submissionId),
    userId: session.userId,
  });
  if (!existing) return { message: "Submission not found." };

  const billPhoto =
    parsed.data.billPhoto && parsed.data.billPhoto.startsWith("data:image/")
      ? parsed.data.billPhoto
      : existing.billPhoto ?? null;

  await col.updateOne(
    { _id: new ObjectId(parsed.data.submissionId) },
    {
      $set: {
        placeOfWork: parsed.data.placeOfWork,
        workDescription: parsed.data.workDescription,
        vehicleNumber: parsed.data.vehicleNumber,
        editedStartTime: parsed.data.editedStartTime
          ? new Date(parsed.data.editedStartTime).toISOString()
          : existing.editedStartTime,
        endTime: parsed.data.endTime
          ? new Date(parsed.data.endTime).toISOString()
          : existing.endTime,
        diesel: parsed.data.diesel === "yes",
        dieselAmount: parsed.data.diesel === "yes" ? (parsed.data.dieselAmount ?? null) : null,
        images: parsed.data.images,
        billPhoto,
        updatedAt: new Date(),
      },
    }
  );

  revalidatePath("/staff/submissions");
  revalidatePath(`/staff/submissions/${parsed.data.submissionId}`);
  revalidatePath("/admin/submissions");
  revalidatePath(`/admin/submissions/${parsed.data.submissionId}`);
  return { success: true };
}

export async function adminUpdateSubmissionAction(
  _prev: AdminUpdateState,
  formData: FormData
): Promise<AdminUpdateState> {
  await requireRole("admin");

  const parsed = AdminUpdateSchema.safeParse({
    submissionId: formData.get("submissionId"),
    paid: formData.get("paid"),
    adminRemark: formData.get("adminRemark") || undefined,
  });

  if (!parsed.success) return { message: "Invalid data." };

  const { ObjectId } = await import("mongodb");
  const db = await getDb();

  await db.collection<SubmissionDoc>("submissions").updateOne(
    { _id: new ObjectId(parsed.data.submissionId) },
    {
      $set: {
        paid: parsed.data.paid === "true",
        adminRemark: parsed.data.adminRemark ?? null,
        updatedAt: new Date(),
      },
    }
  );

  revalidatePath("/admin/submissions");
  revalidatePath(`/admin/submissions/${parsed.data.submissionId}`);
  return { success: true };
}
