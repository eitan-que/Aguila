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
  intent?: "default" | "accent" | "danger" | "success";
}

const intentMap: Record<string,string> = {
  default: "",
  accent: "border-primary/40",
  danger: "border-red-500/40",
  success: "border-emerald-500/40"
};

export function MetricCard({ label, value, hint, trend, icon, className, intent="default" }: MetricCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between gap-3 bg-card/60 supports-[backdrop-filter]:bg-card/50 hover:bg-accent/10 backdrop-blur p-4 border rounded-lg transition-colors",
        intentMap[intent],
        className
      )}
    >
      <div className="flex items-start gap-3">
        {icon && <div className="text-muted-foreground group-hover:scale-110 transition-transform" aria-hidden>{icon}</div>}
        <div className="flex flex-col gap-1 min-w-0">
          <p className="font-medium text-muted-foreground text-xs truncate uppercase tracking-wide">
            {label}
          </p>
          <span className="font-semibold tabular-nums text-2xl leading-none">
            {value}
          </span>
          {hint && <span className="text-[11px] text-muted-foreground truncate">{hint}</span>}
        </div>
      </div>
      {trend && (
        <div
          className={cn(
            "flex items-center gap-1 font-medium text-[11px]",
            trend.positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          )}
        >
          <span>{trend.positive ? '▲' : '▼'}</span>
          <span>{trend.value}%</span>
          <span className="font-normal text-muted-foreground">{trend.label}</span>
        </div>
      )}
      <span className="bottom-0 absolute inset-x-0 bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 h-0.5 transition-opacity pointer-events-none" />
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
