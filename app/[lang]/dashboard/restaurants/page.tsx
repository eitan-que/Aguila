import { getDictionary, Lang } from '@/actions/dictionaries';
import { getRestaurants } from '@/actions/restaurant';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import Link from 'next/link';
import { GridSection } from '@/components/dashboard/blocks';
import { MetricCard } from '@/components/dashboard/cards';

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
  return (
    <main className="flex flex-col gap-10 p-6">
      <header className="flex justify-between items-center">
        <h1 className="font-bold text-2xl tracking-tight">{dict.dashboard.restaurants.listTitle}</h1>
        {role === 'admin' && (
          <Link href={`/${lang}/dashboard/restaurants/new`} className="hover:bg-muted px-3 py-2 border rounded text-sm">
            {dict.dashboard.restaurants.new}
          </Link>
        )}
      </header>
      <div className="flex flex-col gap-10">
        <GridSection title={dict.dashboard.sections.overview}>
          <MetricCard label={dict.dashboard.stats.restaurants} value={restaurants.length} />
        </GridSection>
        <div className="gap-4 grid">
          {restaurants.map((r: any) => {
            const categories = r.categories || [];
            const products = categories.flatMap((c: any) => c.products || []);
            return (
              <div key={r.id} className="flex flex-col gap-3 bg-card p-4 border rounded-lg">
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div className="min-w-0">
                    <Link href={`/${lang}/dashboard/restaurants/${r.id}`} className="block font-medium text-sm hover:underline truncate">{r.name}</Link>
                    <span className="text-muted-foreground text-xs">{r.slug}</span>
                  </div>
                  <Link href={`/${lang}/dashboard/restaurants/${r.id}`} className="hover:bg-muted px-2 py-1 border rounded text-xs">
                    {dict.dashboard.restaurants.edit}
                  </Link>
                </div>
                <div className="gap-2 grid grid-cols-3 text-[11px]">
                  <div className="bg-muted/50 p-2 rounded">
                    <p className="text-muted-foreground">{dict.dashboard.restaurants.categoriesLabel}</p>
                    <p className="font-medium text-xs">{categories.length}</p>
                  </div>
                  <div className="bg-muted/50 p-2 rounded">
                    <p className="text-muted-foreground">{dict.dashboard.restaurants.productsLabel}</p>
                    <p className="font-medium text-xs">{products.length}</p>
                  </div>
                  <div className="bg-muted/50 p-2 rounded">
                    <p className="text-muted-foreground">{dict.dashboard.restaurants.discountsLabel}</p>
                    <p className="font-medium text-xs">{r.discountsCount ?? 0}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <Link href={`/${lang}/dashboard/restaurants/${r.id}/categories`} className="bg-muted hover:bg-accent px-2 py-1 rounded">
                    {dict.dashboard.restaurants.categoriesLabel}
                  </Link>
                  <Link href={`/${lang}/dashboard/restaurants/${r.id}/products`} className="bg-muted hover:bg-accent px-2 py-1 rounded">
                    {dict.dashboard.restaurants.productsLabel}
                  </Link>
                  <Link href={`/${lang}/dashboard/restaurants/${r.id}/discounts`} className="bg-muted hover:bg-accent px-2 py-1 rounded">
                    {dict.dashboard.restaurants.discountsLabel}
                  </Link>
                </div>
              </div>
            );
          })}
          {restaurants.length === 0 && (
            <div className="p-6 border rounded text-muted-foreground text-sm text-center">(empty)</div>
          )}
        </div>
      </div>
    </main>
  );
}
