import React from "react";
import { cn } from "@/lib/utils";

export function Section({
  title,
  actions,
  children,
  className,
  compact
}: {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      <div className="flex justify-between items-center gap-4">
        <h2 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
          {title}
        </h2>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div
        className={cn(
          "gap-4 grid",
          compact
            ? "auto-rows-fr"
            : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6"
        )}
      >
        {children}
      </div>
    </section>
  );
}