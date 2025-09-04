import { MetricCardSkeleton } from '@/components/dashboard/cards';
import { GridSectionSkeleton } from '@/components/dashboard/blocks';

export default function LoadingRestaurantDetail() {
  return (
    <main className="flex flex-col gap-10 p-6">
      <header className="flex flex-wrap justify-between items-center gap-4">
        <div className="space-y-2">
          <div className="h-7 w-60 bg-muted rounded" />
          <div className="h-3 w-32 bg-muted rounded" />
        </div>
        <div className="h-6 w-16 bg-muted rounded" />
      </header>
      <div className="flex flex-col gap-10">
        <GridSectionSkeleton cards={6} />
        <GridSectionSkeleton cards={7} />
        <div className="border rounded-lg p-4 space-y-4 animate-pulse">
          <div className="h-4 w-40 bg-muted rounded" />
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-3/4 bg-muted rounded" />
        </div>
      </div>
    </main>
  );
}