import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel = "← Back",
  actions,
  className
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-wrap justify-between items-start gap-4 pb-4 border-b",
        className
      )}
    >
      <div className="flex flex-col gap-1 min-w-0">
        <h1 className="font-bold text-2xl leading-tight tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground text-xs truncate">{subtitle}</p>
        )}
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex hover:bg-muted mt-2 px-2 py-1 border rounded w-fit text-[11px] transition-colors"
          >
            {backLabel}
          </Link>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </header>
  );
}