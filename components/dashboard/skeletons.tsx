import React from "react";
import { cn } from "@/lib/utils";

function line(w: string, h = "h-3") {
  return <div className={cn("bg-muted rounded", w, h)} />;
}

export function SkeletonHeader({ lines = 2 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="bg-muted rounded w-[200px] h-6" />
      ))}
    </div>
  );
}

export function MetricGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="gap-4 grid sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
            className="flex flex-col gap-3 bg-card p-4 border rounded-lg animate-pulse"
        >
          {line("w-20")}
          {line("w-24", "h-7")}
          {line("w-32")}
        </div>
      ))}
    </div>
  );
}

export function ResourceListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="border rounded-lg divide-y animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex justify-between items-center px-4 py-3 text-sm"
        >
          <div className="space-y-2">
            {line("w-40")}
            {line("w-24")}
          </div>
          {line("w-10")}
        </div>
      ))}
    </div>
  );
}

export function PageSkeletonLayout({
  headerLines = 1,
  metricBlocks = [],
  listRows
}: {
  headerLines?: number;
  metricBlocks?: number[];
  listRows?: number;
}) {
  return (
    <main className="flex flex-col gap-10 p-6 w-full min-h-screen">
      <div className="space-y-3">
        {Array.from({ length: headerLines }).map((_, i) => (
          <div key={i} className="bg-muted rounded w-64 h-8" />
        ))}
      </div>
      {metricBlocks.map((c, i) => (
        <MetricGridSkeleton key={i} count={c} />
      ))}
      {typeof listRows === "number" && <ResourceListSkeleton rows={listRows} />}
    </main>
  );
}

export function FormSkeleton({ groups = 2, fieldsPerGroup = 3 }: { groups?: number; fieldsPerGroup?: number }) {
  return (
    <main className="flex flex-col gap-8 p-6 max-w-xl">
      <div className="bg-muted rounded w-72 h-8" />
      <form className="flex flex-col gap-5">
        {Array.from({ length: groups }).map((_, g) => (
          <div key={g} className="gap-4 grid grid-cols-2 max-sm:grid-cols-1">
            {Array.from({ length: fieldsPerGroup }).map((__, f) => (
              <div key={f} className="flex flex-col gap-2">
                <div className="bg-muted rounded w-20 h-3" />
                <div className="bg-muted rounded w-full h-9" />
              </div>
            ))}
          </div>
        ))}
        <div className="flex gap-3">
          <div className="bg-muted rounded w-24 h-9" />
          <div className="bg-muted rounded w-24 h-9" />
        </div>
      </form>
    </main>
  );
}