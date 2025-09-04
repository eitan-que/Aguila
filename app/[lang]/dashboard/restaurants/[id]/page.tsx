import { getDictionary, Lang } from '@/actions/dictionaries';
import { getRestaurant } from '@/actions/restaurant';
import { getRestaurantDetailedAnalytics } from '@/actions/analytics';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import Link from 'next/link';
import { GridSection } from '@/components/dashboard/blocks';
import { MetricCard } from '@/components/dashboard/cards';

export default async function DashboardRestaurantManage({ params }: { params: Promise<{ lang: Lang; id: string }> }) {
  const { lang, id } = await params;
  const dict = await getDictionary(lang);
  const session = await auth.api.getSession({ headers: await headers() });
  const role = session?.user?.role;
  if (!(role === 'admin' || role === 'restaurantOwner')) {
    return <div className="p-6 text-sm text-center">{dict.dashboard.error.unauthorizedDescription}</div>;
  }
  const r = await getRestaurant(id, { recordVisit: false });
  if ('error' in r || !r.restaurant) {
    return <div className="p-6 text-sm">{dict.dashboard.error.title}</div>;
  }
  const analytics = await getRestaurantDetailedAnalytics(id);
  const a: any = (analytics as any).analytics;
  const d = dict.dashboard.restaurant;
  return (
    <main className="flex flex-col gap-10 p-6">
      <header className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-2xl tracking-tight">{r.restaurant.name}</h1>
          <p className="text-muted-foreground text-xs">ID: {r.restaurant.id}</p>
        </div>
        <Link href={`/${lang}/dashboard/restaurants`} className="hover:bg-muted px-3 py-1 border rounded text-xs">← {dict.dashboard.restaurants.back}</Link>
      </header>
      <div className="flex flex-col gap-10">
        <GridSection title={d.projections}>
          <MetricCard label={d.ageInMonths} value={a.ageInMonths} />
          <MetricCard label={d.visitsWeekly} value={a.visits.weekly} />
          <MetricCard label={d.visitsMonthly} value={a.visits.monthly} />
          <MetricCard label={d.mostVisitedDay} value={a.visits.mostVisitedDay} />
          <MetricCard label={d.costPerExposure} value={a.categoryMetrics.costPerExposure} />
          <MetricCard label={d.shareOfAttention} value={`${a.categoryMetrics.shareOfAttention}%`} />
        </GridSection>
        <GridSection title={d.interactions}>
          <MetricCard label={d.promotionScans} value={a.interactions.promotionScans} />
          <MetricCard label={d.successfulPromoScans} value={a.interactions.promotionScansSuccessful} />
          <MetricCard label={d.whatsappClicks} value={a.interactions.whatsappClicks} />
          <MetricCard label={d.locationClicks} value={a.interactions.locationClicks} />
          <MetricCard label={d.menuClicks} value={a.interactions.menuClicks} />
          <MetricCard label={d.instagramClicks} value={a.interactions.instagramClicks} />
          <MetricCard label={d.shareClicks} value={a.interactions.shareClicks} />
        </GridSection>
        <GridSection title={d.perCategory.title}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="text-muted-foreground">
                <tr className="text-left">
                  <th className="py-2 pr-4">{d.perCategory.category}</th>
                  <th className="py-2 pr-4">{d.perCategory.share}</th>
                  <th className="py-2 pr-4">{d.perCategory.ranking}</th>
                  <th className="py-2 pr-4">{d.perCategory.restaurants}</th>
                  <th className="py-2 pr-4">{d.perCategory.visits}</th>
                  <th className="py-2 pr-4">{d.perCategory.yourVisits}</th>
                </tr>
              </thead>
              <tbody>
                {a.categoryMetrics.perCategory.map((c: any) => (
                  <tr key={c.categoryName} className="border-t">
                    <td className="py-2 pr-4 font-medium">{c.categoryName}</td>
                    <td className="py-2 pr-4">{c.shareOfAttention}%</td>
                    <td className="py-2 pr-4">{c.ranking}</td>
                    <td className="py-2 pr-4">{c.totalRestaurants}</td>
                    <td className="py-2 pr-4">{c.totalVisitsCategory}</td>
                    <td className="py-2 pr-4">{c.restaurantVisits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GridSection>
      </div>
    </main>
  );
}
