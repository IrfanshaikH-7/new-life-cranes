import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { ensureAdminSeed } from "@/lib/seed";
import { ensureIndexes } from "@/lib/indexes";
import { SignInForm } from "./sign-in-form";

export default async function SignInPage() {
  await ensureAdminSeed();
  await ensureIndexes();
  const session = await getSession();
  if (session) {
    redirect(session.role === "admin" ? "/admin" : "/staff");
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-accent p-4">
      <div className="w-full max-w-md">
        <div className="rounded-4xl bg-background p-8 shadow-sm">
          <div className="mb-8 flex flex-col gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <span className="text-sm font-semibold">N</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to your workspace to continue.
            </p>
          </div>

          <SignInForm />

          <p className="mt-6 text-center text-xs text-muted-foreground">
            New accounts are created by your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
