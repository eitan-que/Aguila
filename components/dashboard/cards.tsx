"use client";
import React from 'react';
import { cn } from '@/lib/utils';

export interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  trend?: { value: number; label: string; positive?: boolean };
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({ label, value, hint, trend, icon, className }: MetricCardProps) {
  return (
    <div className={cn('relative flex flex-col justify-between gap-3 bg-card hover:bg-accent/10 p-4 border rounded-lg transition-colors', className)}>
      <div className="flex items-start gap-3">
        {icon && <div className="text-muted-foreground" aria-hidden>{icon}</div>}
        <div className="flex flex-col gap-1 min-w-0">
          <p className="font-medium text-muted-foreground text-xs truncate uppercase tracking-wide">{label}</p>
          <span className="font-semibold tabular-nums text-2xl leading-none">{value}</span>
          {hint && <span className="text-muted-foreground text-xs truncate">{hint}</span>}
        </div>
      </div>
      {trend && (
        <div className={cn('flex items-center gap-1 font-medium text-xs', trend.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
          <span>{trend.positive ? '▲' : '▼'}</span>
          <span>{trend.value}%</span>
          <span className="font-normal text-muted-foreground">{trend.label}</span>
        </div>
      )}
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="space-y-3 bg-card p-4 border rounded-lg animate-pulse">
      <div className="bg-muted rounded w-24 h-3" />
      <div className="bg-muted rounded w-20 h-7" />
      <div className="bg-muted rounded w-40 h-3" />
      <div className="bg-muted rounded w-16 h-3" />
    </div>
  );
}
