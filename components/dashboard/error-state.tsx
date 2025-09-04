"use client";
import Link from 'next/link';
import { RefreshCcw } from 'lucide-react';
import React from 'react';

export function ErrorState({
  title,
  description,
  retryHref,
  retryLabel,
  children
}: {
  title: string;
  description?: string;
  retryHref?: string;
  retryLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <div role="alert" className="flex flex-col justify-center items-center gap-4 p-6 min-h-[40vh] text-center">
      <h1 className="font-bold text-2xl" data-testid="error-title">{title}</h1>
      {description && <p className="max-w-md text-muted-foreground text-sm" data-testid="error-description">{description}</p>}
      {retryHref && (
        <Link
          href={retryHref}
          className="inline-flex items-center gap-2 hover:bg-muted px-4 py-2 border rounded focus-visible:outline-none ring-primary focus-visible:ring-2 ring-offset-2 ring-offset-background text-sm transition-colors"
          aria-label={retryLabel}
        >
          <RefreshCcw className="w-4 h-4" aria-hidden /> {retryLabel}
        </Link>
      )}
      {children}
    </div>
  );
}
