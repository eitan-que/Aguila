import { getDictionary, Lang } from '@/actions/dictionaries';
import { getRestaurants } from '@/actions/restaurant';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import Link from 'next/link';
import { PageShell, PageSections } from '@/components/dashboard/page-shell';
import { PageHeader } from '@/components/dashboard/page-header';
import { Section } from '@/components/dashboard/section';
import { MetricCard } from '@/components/dashboard/cards';
import { ResourceList } from '@/components/dashboard/resource-list';

export default async function DashboardRestaurants({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const session = await auth.api.getSession({ headers: await headers() });
  const role = session?.user?.role;
  if (!(role === 'admin' || role === 'restaurantOwner')) {
    return <div className="p-6 text-sm text-center">{dict.dashboard.error.unauthorizedDescription}</div>;
  }
  const data = await getRestaurants();
  if ('error' in data) {
    return <div className="p-6">{dict.dashboard.error.title}</div>;
  }
  const restaurants = data.restaurants || [];
  const resources = restaurants.map((r: any) => {
    const categories = r.categories || [];
    const products = categories.flatMap((c: any) => c.products || []);
    return {
      id: r.id,
      title: r.name,
      subtitle: r.slug,
      metaRight: r.id.slice(0,6),
      hint: `${categories.length} cat · ${products.length} prod · ${(r.discountsCount ?? 0)} disc.`,
      href: `/${lang}/dashboard/restaurants/${r.id}`
    };
  });
  return (
    <PageShell>
      <PageHeader
        title={dict.dashboard.restaurants.listTitle}
        actions={
          role === 'admin' && (
            <Link href={`/${lang}/dashboard/restaurants/new`} className="hover:bg-muted px-3 py-2 border rounded text-xs">
              {dict.dashboard.restaurants.new}
            </Link>
          )
        }
      />
      <PageSections>
        <Section title={dict.dashboard.sections.overview}>
          <MetricCard label={dict.dashboard.stats.restaurants} value={restaurants.length} />
        </Section>
        <div>
          <ResourceList resources={resources} emptyLabel="(empty)" />
        </div>
      </PageSections>
    </PageShell>
  );
}
