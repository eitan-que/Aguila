import { MetricCardSkeleton } from '@/components/dashboard/cards';
import { GridSectionSkeleton } from '@/components/dashboard/blocks';

export default function DashboardLoading() {
  return (
    <main className="flex flex-col gap-10 p-6 w-full min-h-screen">
      <div className="space-y-3">
        <div className="bg-muted rounded w-60 h-8" />
        <div className="bg-muted rounded w-96 h-4" />
      </div>
      <GridSectionSkeleton cards={6} />
      <GridSectionSkeleton cards={6} />
      <GridSectionSkeleton cards={6} />
      <div className="gap-4 grid sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_,i)=>(<MetricCardSkeleton key={i}/>))}
      </div>
    </main>
  );
}
