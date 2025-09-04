import { getDictionary, Lang } from '@/actions/dictionaries';
import { getPlatformMetrics } from '@/actions/analytics';
import { ErrorState } from '@/components/dashboard/error-state';
import { GridSection } from '@/components/dashboard/blocks';
import { MetricCard } from '@/components/dashboard/cards';

export default async function DashboardRoot({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const metricsRes = await getPlatformMetrics();
  if ('error' in metricsRes && !('metrics' in metricsRes)) {
    return <ErrorState title={dict.dashboard.error.title} description={dict.dashboard.error.description} retryHref={`/${lang}/dashboard`} retryLabel={dict.dashboard.error.retry} />;
  }
  const m = (metricsRes as any).metrics;
  const d = dict.dashboard;
  return (
    <main className="flex flex-col gap-10 p-6 w-full min-h-screen">
      <header className="flex flex-col gap-2">
        <h1 className="font-bold text-3xl tracking-tight">{d.title}</h1>
      </header>
      <div className="flex flex-col gap-10">
        <GridSection title={d.sections.overview}>
          <MetricCard label={d.stats.restaurants} value={m.totalRestaurants} />
          <MetricCard label={d.stats.products} value={m.totalProducts} />
          <MetricCard label={d.stats.activeDiscounts} value={m.activeDiscounts} />
          <MetricCard label={d.stats.qrScans} value={m.qrScans} />
          <MetricCard label={d.stats.visits24h} value={m.visits.last24h} />
          <MetricCard label={d.stats.visits7d} value={m.visits.last7Days} />
        </GridSection>
        <GridSection title={d.sections.engagement}>
          <MetricCard label={d.stats.instagramClicks} value={m.instagramClicks} />
          <MetricCard label={d.stats.shareClicks} value={m.shareClicks} />
          <MetricCard label={d.stats.conversionRate} value={`${m.conversionRate}%`} />
          <MetricCard label={d.labels.peakHour} value={m.peakHour} />
          <MetricCard label={d.labels.mostVisitedDay} value={m.mostVisitedDay} />
          <MetricCard label={d.stats.promoViews} value={m.promoViews} />
        </GridSection>
        <GridSection title={d.sections.users}>
          <MetricCard label={d.stats.registeredUsers} value={m.registeredUsers} />
          <MetricCard label={d.stats.totalUsers} value={m.totalUsers} />
          <MetricCard label={d.stats.registeredPct} value={`${m.registeredUsersPercentage}%`} />
          <MetricCard label={d.stats.returnRate} value={`${m.returnRate}%`} />
          <MetricCard label={d.stats.weeklyGrowth} value={`${m.userGrowth.weekly}%`} />
          <MetricCard label={d.stats.monthlyGrowth} value={`${m.userGrowth.monthly}%`} />
        </GridSection>
        <GridSection title={d.sections.extremes}>
          <MetricCard label={d.labels.mostVisited} value={m.restaurantExtremes.mostVisited?.name || '-'} hint={`${m.restaurantExtremes.mostVisited?.visits ?? 0} ${d.stats.visits7d.split(' ')[0]}`} />
          <MetricCard label={d.labels.leastVisited} value={m.restaurantExtremes.leastVisited?.name || '-'} hint={`${m.restaurantExtremes.leastVisited?.visits ?? 0} ${d.stats.visits7d.split(' ')[0]}`} />
          <MetricCard label={d.labels.mostViewedPromo} value={m.promotionExtremes.mostViewed?.name || '-'} hint={`${m.promotionExtremes.mostViewed?.views ?? 0} views`} />
          <MetricCard label={d.labels.leastViewedPromo} value={m.promotionExtremes.leastViewed?.name || '-'} hint={`${m.promotionExtremes.leastViewed?.views ?? 0} views`} />
          <MetricCard label={d.labels.mostRedeemedPromo} value={m.promotionExtremes.mostRedeemed?.name || '-'} hint={`${m.promotionExtremes.mostRedeemed?.redemptions ?? 0} red.`} />
          <MetricCard label={d.labels.leastRedeemedPromo} value={m.promotionExtremes.leastRedeemed?.name || '-'} hint={`${m.promotionExtremes.leastRedeemed?.redemptions ?? 0} red.`} />
        </GridSection>
      </div>
    </main>
  );
}
