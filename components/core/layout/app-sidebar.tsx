"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Users,
  Briefcase,
  ClipboardList,
  LogOut,
  PanelLeft,
} from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutGrid },
  { label: "Staff", href: "/admin/staff", icon: Users },
  { label: "Submissions", href: "/admin/submissions", icon: ClipboardList },
];

const STAFF_NAV: NavItem[] = [
  { label: "Dashboard", href: "/staff", icon: LayoutGrid },
  { label: "My Work", href: "/staff/submissions", icon: Briefcase },
];

interface AppSidebarProps {
  role: Role;
}

export function AppSidebar({ role }: AppSidebarProps) {
  const pathname = usePathname();
  const items = role === "admin" ? ADMIN_NAV : STAFF_NAV;

  return (
    <aside className="sticky top-0 flex h-svh w-12 shrink-0 flex-col justify-between py-3 sm:w-14 md:w-16 md:py-4">
      <div className="flex justify-center px-2">
        <div className="flex size-9 items-center justify-center rounded-full text-muted-foreground sm:size-10">
          <PanelLeft strokeWidth={1.8} className="size-4 sm:size-5" />
        </div>
      </div>

      <nav className="flex w-full flex-1 flex-col items-center gap-1 px-2 pt-2 md:pt-4">
        {items.map((item) => {
          const isActive =
            item.href === `/${role}`
              ? pathname === item.href
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              className={cn(
                "flex size-9 items-center justify-center rounded-full transition-colors sm:size-10",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon strokeWidth={1.8} className="size-4 sm:size-5" />
            </Link>
          );
        })}
      </nav>

      <div className="flex justify-center px-2">
        <form action={signOutAction}>
          <button
            type="submit"
            title="Sign out"
            aria-label="Sign out"
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:size-10"
          >
            <LogOut strokeWidth={1.8} className="size-4 sm:size-5" />
          </button>
        </form>
      </div>
    </aside>
  );
}
