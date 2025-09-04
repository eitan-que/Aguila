import { getDictionary, Lang } from '@/actions/dictionaries';
import { getRestaurant } from '@/actions/restaurant';
import { getRestaurantDetailedAnalytics } from '@/actions/analytics';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import Link from 'next/link';
import { PageShell, PageSections } from '@/components/dashboard/page-shell';
import { PageHeader } from '@/components/dashboard/page-header';
import { Section } from '@/components/dashboard/section';
import { MetricCard } from '@/components/dashboard/cards';
import { ResourceManagers } from '@/components/dashboard/resource-managers';
import { getDiscountsByRestaurant } from '@/actions/discount';

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
  const discountsRes = await getDiscountsByRestaurant(id);
  const discounts: any[] = 'discounts' in discountsRes ? (discountsRes as any).discounts : [];
  const a: any = (analytics as any).analytics;
  const d = dict.dashboard.restaurant;
  return (
    <PageShell>
      <PageHeader
        title={r.restaurant.name}
        subtitle={`ID: ${r.restaurant.id}`}
        backHref={`/${lang}/dashboard/restaurants`}
        backLabel={`← ${dict.dashboard.restaurants.back}`}
        actions={
          <Link href={`/${lang}/dashboard/restaurants/${id}/edit`} className="hover:bg-muted px-3 py-2 border rounded text-xs">
            {dict.dashboard.restaurants.edit}
          </Link>
        }
      />
      <PageSections>
        <Section title={d.projections}>
          <MetricCard label={d.ageInMonths} value={a.ageInMonths} />
          <MetricCard label={d.visitsWeekly} value={a.visits.weekly} />
          <MetricCard label={d.visitsMonthly} value={a.visits.monthly} />
          <MetricCard label={d.mostVisitedDay} value={a.visits.mostVisitedDay} />
          <MetricCard label={d.costPerExposure} value={a.categoryMetrics.costPerExposure} />
          <MetricCard label={d.shareOfAttention} value={`${a.categoryMetrics.shareOfAttention}%`} />
        </Section>
        <Section title={d.interactions}>
          <MetricCard label={d.promotionScans} value={a.interactions.promotionScans} />
          <MetricCard label={d.successfulPromoScans} value={a.interactions.promotionScansSuccessful} />
          <MetricCard label={d.whatsappClicks} value={a.interactions.whatsappClicks} />
          <MetricCard label={d.locationClicks} value={a.interactions.locationClicks} />
          <MetricCard label={d.menuClicks} value={a.interactions.menuClicks} />
          <MetricCard label={d.instagramClicks} value={a.interactions.instagramClicks} />
          <MetricCard label={d.shareClicks} value={a.interactions.shareClicks} />
        </Section>
        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
            {d.perCategory.title}
          </h2>
          <div className="bg-card border rounded-lg overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-muted/40 text-muted-foreground">
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
        </div>
        <div className="flex flex-col gap-6">
          <h2 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
            {dict.dashboard.restaurant.manageTitle || 'Manage Resources'}
          </h2>
          <ResourceManagers
            lang={lang}
            restaurantId={r.restaurant.id}
            categories={(r.restaurant.categories || []).map((c:any)=>({ id: c.id, name: c.name }))}
            products={(r.restaurant.categories || []).flatMap((c:any)=> (c.products||[]).map((p:any)=>({ id: p.id, name: p.name })))}
            discounts={discounts.map((di:any)=>({ id: di.id, name: di.name, type: di.type, value: di.value }))}
            dict={{
              title: 'Gestión',
              view: dict.dashboard.actions.view || 'Ver',
              create: dict.dashboard.actions.new || 'Crear',
              edit: dict.dashboard.actions.edit || 'Editar',
              del: dict.dashboard.actions.delete || 'Eliminar',
              selectPlaceholder: dict.dashboard.actions.select || 'Seleccionar…',
              categories: dict.dashboard.restaurants.categoriesLabel,
              products: dict.dashboard.restaurants.productsLabel,
              discounts: dict.dashboard.restaurants.discountsLabel,
              confirm: dict.dashboard.actions.confirmDelete || '¿Confirmar eliminación?'
            }}
          />
        </div>
      </PageSections>
    </PageShell>
  );
}
