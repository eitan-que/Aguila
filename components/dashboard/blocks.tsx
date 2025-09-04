"use client";
import React from 'react';
import { MetricCard, MetricCardSkeleton } from './cards';

export function GridSection({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex justify-between items-center gap-4">
        <h2 className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">{title}</h2>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="gap-4 grid sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 xl:grid-cols-4">
        {children}
      </div>
    </section>
  );
}

export function GridSectionSkeleton({ cards }: { cards?: number }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-muted rounded w-40 h-4" />
      <div className="gap-4 grid sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 xl:grid-cols-4">
        {Array.from({ length: cards ?? 6 }).map((_,i)=>(<MetricCardSkeleton key={i}/>))}
      </div>
    </div>
  );
}
