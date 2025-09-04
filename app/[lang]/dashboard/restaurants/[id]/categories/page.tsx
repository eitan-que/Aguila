import { getDictionary, Lang } from '@/actions/dictionaries';
import { getRestaurant } from '@/actions/restaurant';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import Link from 'next/link';
import { GridSection } from '@/components/dashboard/blocks';

export default async function DashboardRestaurantCategories({ params }: { params: Promise<{ lang: Lang; id: string }> }) {
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
  return (
    <main className="flex flex-col gap-10 p-6">
      <header className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="font-bold text-2xl tracking-tight">{dict.dashboard.restaurants.categoriesLabel} — {r.restaurant.name}</h1>
        <Link href={`/${lang}/dashboard/restaurants/${id}`} className="hover:bg-muted px-3 py-1 border rounded text-xs">← {dict.dashboard.restaurants.back}</Link>
      </header>
      <div className="flex flex-col gap-10">
        <GridSection title={dict.dashboard.sections.overview}>
          <div className="flex flex-wrap gap-4 col-span-full bg-card p-4 border rounded-lg text-xs">
            <div>
              <p className="text-muted-foreground">{dict.dashboard.restaurants.categoriesLabel}</p>
              <p className="font-medium">{categories.length}</p>
            </div>
          </div>
        </GridSection>
        <div className="border rounded-lg divide-y">
          {categories.map((c: any) => (
            <div key={c.id} className="flex justify-between items-center px-4 py-3">
              <div>
                <p className="font-medium text-sm">{c.name}</p>
                <p className="text-muted-foreground text-xs">{c.products?.length || 0} {dict.dashboard.restaurants.productsLabel.toLowerCase()}</p>
              </div>
              <span className="text-[11px] text-muted-foreground">{c.id.slice(0,6)}</span>
            </div>
          ))}
          {categories.length === 0 && <div className="p-4 text-muted-foreground text-sm">(empty)</div>}
        </div>
      </div>
    </main>
  );
}
