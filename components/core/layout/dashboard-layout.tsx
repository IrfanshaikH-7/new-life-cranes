import type { ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import { PageHeader } from "./page-header";
import type { Role } from "@/lib/types";

interface DashboardLayoutProps {
  role: Role;
  title: string;
  subtitle?: string;
  headerAction?: ReactNode;
  children: ReactNode;
}

export function DashboardLayout({
  role,
  title,
  subtitle,
  headerAction,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="flex min-h-svh w-full bg-accent">
      <AppSidebar role={role} />
      <main className="flex-1 min-w-0 py-2 pr-2 md:py-3 md:pr-3">
        <div className="flex h-full flex-col gap-3 rounded-2xl bg-background p-3 md:gap-4 md:rounded-4xl md:p-4">
          <PageHeader title={title} subtitle={subtitle} action={headerAction} />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </main>
    </div>
  );
}
