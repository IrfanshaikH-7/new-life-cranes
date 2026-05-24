"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/mongodb";
import { ensureAdminSeed } from "@/lib/seed";
import { createSession, deleteSession } from "@/lib/session";
import type { UserDoc } from "@/lib/types";

const SignInSchema = z.object({
  email: z.string().email({ message: "Enter a valid email." }).trim(),
  password: z.string().min(1, { message: "Password is required." }),
});

export type SignInState =
  | {
      errors?: { email?: string[]; password?: string[] };
      message?: string;
    }
  | undefined;

export async function signInAction(
  _prev: SignInState,
  formData: FormData
): Promise<SignInState> {
  await ensureAdminSeed();

  const parsed = SignInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const email = parsed.data.email.toLowerCase();
  const db = await getDb();
  const user = await db.collection<UserDoc>("users").findOne({ email });

  if (!user) {
    return { message: "Invalid email or password." };
  }

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) {
    return { message: "Invalid email or password." };
  }

  await createSession({
    userId: user._id!.toString(),
    role: user.role,
    email: user.email,
    name: user.name,
  });

  redirect(user.role === "admin" ? "/admin" : "/staff");
}

export async function signOutAction(): Promise<void> {
  await deleteSession();
  redirect("/sign-in");
}
