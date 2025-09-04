import { getDictionary, Lang } from '@/actions/dictionaries';
import { getRestaurant } from '@/actions/restaurant';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { PageShell, PageSections } from '@/components/dashboard/page-shell';
import { PageHeader } from '@/components/dashboard/page-header';
import { Section } from '@/components/dashboard/section';
import { MetricCard } from '@/components/dashboard/cards';
import { ResourceList } from '@/components/dashboard/resource-list';

export default async function DashboardRestaurantProducts({ params }: { params: Promise<{ lang: Lang; id: string }> }) {
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
  const categories = r.restaurant.categories || [];
  const products = categories.flatMap((c: any) => c.products || []);
  const resources = products.map((p: any) => ({
    id: p.id,
    title: p.name,
    subtitle: p.category?.name || '',
    hint: `$${(p.price/100).toFixed(2)}`,
    metaRight: (p.categoryId || '').slice(0,6)
  }));
  return (
    <PageShell>
      <PageHeader
        title={`${dict.dashboard.restaurants.productsLabel} — ${r.restaurant.name}`}
        backHref={`/${lang}/dashboard/restaurants/${id}`}
        backLabel={`← ${dict.dashboard.restaurants.back}`}
      />
      <PageSections>
        <Section title={dict.dashboard.sections.overview}>
          <MetricCard label={dict.dashboard.restaurants.productsLabel} value={products.length} />
        </Section>
        <div>
          <ResourceList resources={resources} emptyLabel="(empty)" />
        </div>
      </PageSections>
    </PageShell>
  );
}
