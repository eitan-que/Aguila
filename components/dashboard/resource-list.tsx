import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface ResourceMeta {
  id: string;
  title: string;
  subtitle?: string;
  metaRight?: string;
  hint?: string;
  href?: string;
}

export function ResourceList({
  resources,
  emptyLabel = "(empty)"
}: {
  resources: ResourceMeta[];
  emptyLabel?: string;
}) {
  if (!resources.length) {
    return (
      <div className="p-6 border rounded-lg text-muted-foreground text-sm text-center">
        {emptyLabel}
      </div>
    );
  }
  return (
    <div className="bg-card border rounded-lg divide-y">
      {resources.map((r) => {
        const Wrapper = r.href ? Link : React.Fragment;
        const wrapperProps = r.href
          ? { href: r.href, className: "block hover:bg-accent/30 transition-colors" }
          : {};
        return (
          <Wrapper key={r.id} {...(wrapperProps as any)}>
            <div
              className={cn(
                "flex justify-between items-center px-4 py-3 text-sm"
              )}
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{r.title}</p>
                {r.subtitle && (
                  <p className="text-muted-foreground text-xs truncate">
                    {r.subtitle}
                  </p>
                )}
                {r.hint && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {r.hint}
                  </p>
                )}
              </div>
              {r.metaRight && (
                <span className="text-[11px] text-muted-foreground">
                  {r.metaRight}
                </span>
              )}
            </div>
          </Wrapper>
        );
      })}
    </div>
  );
}