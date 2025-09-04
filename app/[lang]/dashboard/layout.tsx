import React from 'react';
import { getDictionary, Lang } from '@/actions/dictionaries';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db/drizzle';
import { category, restaurant } from '@/db/schema';
import { inArray } from 'drizzle-orm';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/dashboard/sidebar';

export default async function DashboardLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const session = await auth.api.getSession({ headers: await headers() });
  const role = session?.user?.role;
  const allowed = role === 'admin' || role === 'restaurantOwner';
  if (!allowed) {
    return (
      <main className="flex flex-col justify-center items-center gap-4 p-6 min-h-screen">
        <h1 className="font-bold text-2xl">{dict.dashboard.error.unauthorizedTitle}</h1>
        <p className="text-muted-foreground">{dict.dashboard.error.unauthorizedDescription}</p>
      </main>
    );
  }
  const restaurantsRows = await db.query.restaurant.findMany({
    columns: { id: true, name: true, slug: true },
  });
  const restaurantIds = restaurantsRows.map(r => r.id);
  let categoriesRows: Array<{ id: string; name: string; restaurantId: string }> = [];
  if (restaurantIds.length) {
    categoriesRows = await db.select({ id: category.id, name: category.name, restaurantId: category.restaurantId }).from(category).where(inArray(category.restaurantId, restaurantIds));
  }
  const categoriesByRestaurant = new Map<string, Array<{ id: string; name: string }>>();
  categoriesRows.forEach(c => {
    const arr = categoriesByRestaurant.get(c.restaurantId) || [];
    arr.push({ id: c.id, name: c.name });
    categoriesByRestaurant.set(c.restaurantId, arr);
  });
  const sidebarRestaurants = restaurantsRows.map(r => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    categories: categoriesByRestaurant.get(r.id) || []
  }));

  return (
    <div className="flex w-full min-h-screen">
      <SidebarProvider>
        <AdminSidebar dict={dict} lang={lang} role={role!} restaurants={sidebarRestaurants} />
        <div className="flex-1 bg-background ml-0 min-h-screen">{children}</div>
      </SidebarProvider>
    </div>
  );
}
