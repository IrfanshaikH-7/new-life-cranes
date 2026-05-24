import "server-only";
import { getDb } from "./mongodb";

let indexed = false;

export async function ensureIndexes() {
  if (indexed) return;
  indexed = true;
  const db = await getDb();
  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("submissions").createIndex({ userId: 1, createdAt: -1 }),
    db.collection("submissions").createIndex({ createdAt: -1 }),
  ]);
}
