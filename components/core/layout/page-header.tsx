import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 px-1 pt-1 md:px-2">
      <div className="min-w-0">
        <h1 className="truncate text-sm font-semibold text-foreground md:text-base">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground md:text-xs">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
