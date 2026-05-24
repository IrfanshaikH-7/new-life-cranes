import "server-only";
import { redirect } from "next/navigation";
import { getSession } from "./session";
import type { Role, SessionPayload } from "./types";

export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session;
}

export async function requireRole(role: Role): Promise<SessionPayload> {
  const session = await requireAuth();
  if (session.role !== role) {
    redirect(session.role === "admin" ? "/admin" : "/staff");
  }
  return session;
}
