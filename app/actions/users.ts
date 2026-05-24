"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/mongodb";
import { requireRole } from "@/lib/auth";
import type { UserDoc } from "@/lib/types";

const CreateStaffSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).trim(),
  email: z.string().email({ message: "Enter a valid email." }).trim(),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." })
    .regex(/[a-zA-Z]/, { message: "Must contain at least one letter." })
    .regex(/[0-9]/, { message: "Must contain at least one number." }),
});

export type CreateStaffState =
  | {
      errors?: { name?: string[]; email?: string[]; password?: string[] };
      message?: string;
      success?: boolean;
    }
  | undefined;

export async function createStaffAction(
  _prev: CreateStaffState,
  formData: FormData
): Promise<CreateStaffState> {
  await requireRole("admin");

  const parsed = CreateStaffSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const email = parsed.data.email.toLowerCase();
  const db = await getDb();
  const users = db.collection<UserDoc>("users");

  const existing = await users.findOne({ email });
  if (existing) {
    return { message: "A user with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const now = new Date();
  await users.insertOne({
    name: parsed.data.name,
    email,
    passwordHash,
    role: "staff",
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/admin/staff");
  return { success: true, message: "Staff member created." };
}
