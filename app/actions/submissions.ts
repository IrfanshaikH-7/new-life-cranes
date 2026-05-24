"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/mongodb";
import { requireRole } from "@/lib/auth";
import type { SubmissionDoc } from "@/lib/types";

const ImageSchema = z
  .string()
  .startsWith("data:image/", { message: "Invalid image data." })
  .max(2_500_000, { message: "Image is too large (max ~2 MB each)." });

const SubmissionSchema = z.object({
  placeOfWork: z
    .string()
    .min(2, { message: "Place of work is required." })
    .max(120, { message: "Place of work is too long." })
    .trim(),
  workDescription: z
    .string()
    .min(5, { message: "Description must be at least 5 characters." })
    .max(2000, { message: "Description is too long." })
    .trim(),
  images: z
    .array(ImageSchema)
    .min(1, { message: "Add at least one image." })
    .max(4, { message: "Up to 4 images allowed." }),
});

export type SubmissionState =
  | {
      errors?: {
        placeOfWork?: string[];
        workDescription?: string[];
        images?: string[];
      };
      message?: string;
      success?: boolean;
    }
  | undefined;

export async function createSubmissionAction(
  _prev: SubmissionState,
  formData: FormData
): Promise<SubmissionState> {
  const session = await requireRole("staff");

  const rawImages = formData.getAll("images").map((v) => String(v));
  const parsed = SubmissionSchema.safeParse({
    placeOfWork: formData.get("placeOfWork"),
    workDescription: formData.get("workDescription"),
    images: rawImages,
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const db = await getDb();
  await db.collection<SubmissionDoc>("submissions").insertOne({
    userId: session.userId,
    userName: session.name,
    placeOfWork: parsed.data.placeOfWork,
    workDescription: parsed.data.workDescription,
    images: parsed.data.images,
    createdAt: new Date(),
  });

  revalidatePath("/staff");
  revalidatePath("/admin/submissions");
  return { success: true, message: "Submission saved." };
}
