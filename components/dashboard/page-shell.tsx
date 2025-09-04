"use client";
import React from "react";
import { cn } from "@/lib/utils";

export function PageShell({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn(
        "flex flex-col gap-10 p-6 w-full min-h-screen animate-in duration-150 fade-in",
        className
      )}
    >
      {children}
    </main>
  );
}

export function PageSections({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-10">{children}</div>;
}