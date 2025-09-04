import { getDictionary, Lang } from '@/actions/dictionaries';
import { getRestaurant } from '@/actions/restaurant';
import { getDiscountsByRestaurant } from '@/actions/discount';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { PageShell, PageSections } from '@/components/dashboard/page-shell';
import { PageHeader } from '@/components/dashboard/page-header';
import { Section } from '@/components/dashboard/section';
import { MetricCard } from '@/components/dashboard/cards';
import { ResourceList } from '@/components/dashboard/resource-list';

export default async function DashboardRestaurantDiscounts({ params }: { params: Promise<{ lang: Lang; id: string }> }) {
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
  const discountsRes = await getDiscountsByRestaurant(id);
  const discounts: any[] = 'discounts' in discountsRes ? (discountsRes as any).discounts : [];
  const resources = discounts.map(d => ({
    id: d.id,
    title: d.name,
    subtitle: `${d.type} — ${d.value}`,
    metaRight: d.id.slice(0,6)
  }));
  return (
    <PageShell>
      <PageHeader
        title={`${dict.dashboard.restaurants.discountsLabel} — ${r.restaurant.name}`}
        backHref={`/${lang}/dashboard/restaurants/${id}`}
        backLabel={`← ${dict.dashboard.restaurants.back}`}
      />
      <PageSections>
        <Section title={dict.dashboard.sections.overview}>
          <MetricCard label={dict.dashboard.restaurants.discountsLabel} value={discounts.length} />
        </Section>
        <div>
          <ResourceList resources={resources} emptyLabel="(empty)" />
        </div>
      </PageSections>
    </PageShell>
  );
}
