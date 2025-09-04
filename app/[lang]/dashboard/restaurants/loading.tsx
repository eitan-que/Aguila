import { MetricCardSkeleton } from '@/components/dashboard/cards';
import { GridSectionSkeleton } from '@/components/dashboard/blocks';

export default function LoadingRestaurantsList() {
  return (
    <main className="flex flex-col gap-10 p-6">
      <header className="flex justify-between items-center">
        <div className="bg-muted rounded w-48 h-8" />
        <div className="bg-muted rounded w-32 h-8" />
      </header>
      <div className="flex flex-col gap-10">
        <GridSectionSkeleton cards={1} />
        <div className="gap-4 grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="gap-3 grid bg-card p-4 border rounded-lg animate-pulse">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="bg-muted rounded w-40 h-4" />
                  <div className="bg-muted rounded w-24 h-3" />
                </div>
                <div className="bg-muted rounded w-14 h-6" />
              </div>
              <div className="gap-2 grid grid-cols-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="space-y-2 bg-muted/50 p-2 rounded">
                    <div className="bg-muted rounded w-16 h-3" />
                    <div className="bg-muted rounded w-6 h-3" />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="bg-muted rounded w-20 h-6" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}