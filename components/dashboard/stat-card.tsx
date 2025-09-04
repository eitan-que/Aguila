"use client";
import React from 'react';
import { cn } from '@/lib/utils';

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  subLabel?: string;
  className?: string;
  icon?: React.ReactNode;
};

export function StatCard({ label, value, subLabel, className, icon }: StatCardProps) {
  return (
    <div
      className={cn(
        'group relative bg-card p-4 border rounded-lg ring-primary/60 focus-within:ring-2 ring-offset-2 ring-offset-background overflow-hidden transition-colors',
        'hover:border-primary/40 hover:bg-accent/10',
        className
      )}
      tabIndex={0}
      aria-label={`${label} ${typeof value === 'string' ? value : ''}`}
    >
      <div className="flex items-start gap-3">
        {icon && <div className="mt-0.5 text-muted-foreground group-hover:scale-110 transition-transform" aria-hidden>{icon}</div>}
        <div className="flex flex-col gap-1 min-w-0">
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide" aria-description={subLabel}>{label}</p>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold tabular-nums text-2xl leading-none tracking-tight">{value}</span>
            {subLabel && <span className="max-w-[120px] text-muted-foreground text-xs truncate" aria-hidden>{subLabel}</span>}
          </div>
        </div>
      </div>
      <span className="bottom-0 absolute inset-x-0 bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 h-0.5 transition-opacity pointer-events-none" />
    </div>
  );
}
