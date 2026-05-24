import "server-only";
import bcrypt from "bcryptjs";
import { getDb } from "./mongodb";
import type { UserDoc } from "./types";

let seeded = false;

/**
 * Ensures a default admin account exists. Runs once per server process.
 */
export async function ensureAdminSeed(): Promise<void> {
  if (seeded) return;
  seeded = true;

  const adminEmail = (process.env.ADMIN_EMAIL || "admin@newlife.com")
    .toLowerCase()
    .trim();
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";

  const db = await getDb();
  const users = db.collection<UserDoc>("users");

  await users.createIndex({ email: 1 }, { unique: true });

  const existing = await users.findOne({ email: adminEmail });
  if (existing) return;

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const now = new Date();
  await users.insertOne({
    name: "Administrator",
    email: adminEmail,
    passwordHash,
    role: "admin",
    createdAt: now,
    updatedAt: now,
  });
}
