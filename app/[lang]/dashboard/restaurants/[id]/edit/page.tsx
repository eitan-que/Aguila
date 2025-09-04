import { getDictionary, Lang } from '@/actions/dictionaries';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { updateRestaurant, getRestaurant } from '@/actions/restaurant';
import { redirect } from 'next/navigation';
import Link from 'next/link';

async function update(formData: FormData) {
  'use server';
  const lang = formData.get('lang') as string;
  const id = formData.get('id') as string;
  const data = {
    name: formData.get('name') as string,
    slug: formData.get('slug') as string,
    description: (formData.get('description') as string) || undefined,
    address: (formData.get('address') as string) || undefined,
    phone: (formData.get('phone') as string) || undefined,
    email: (formData.get('email') as string) || undefined,
    website: (formData.get('website') as string) || undefined,
  };
  const res = await updateRestaurant(id, data as any);
  if ('error' in res) {
    redirect(`/${lang}/dashboard/restaurants/${id}?error=1`);
  }
  redirect(`/${lang}/dashboard/restaurants/${id}`);
}

export default async function EditRestaurantDashboardPage({ params }: { params: Promise<{ lang: Lang; id: string }> }) {
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
  const restaurant = r.restaurant as any;
  return (
    <main className="flex flex-col gap-8 p-6 max-w-xl">
      <header className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="font-bold text-2xl tracking-tight">{dict.dashboard.restaurants.edit} — {restaurant.name}</h1>
        <Link href={`/${lang}/dashboard/restaurants/${restaurant.id}`} className="hover:bg-muted px-3 py-1 border rounded text-xs">← {dict.dashboard.restaurants.back}</Link>
      </header>
      <form action={update} className="flex flex-col gap-4">
        <input type="hidden" name="lang" value={lang} />
        <input type="hidden" name="id" value={restaurant.id} />
        <div className="flex flex-col gap-1">
          <label className="font-medium text-sm">Name</label>
          <input name="name" defaultValue={restaurant.name} required className="bg-background px-3 py-2 border rounded" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-medium text-sm">Slug</label>
            <input name="slug" defaultValue={restaurant.slug} required className="bg-background px-3 py-2 border rounded" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-medium text-sm">Description</label>
          <textarea name="description" defaultValue={restaurant.description || ''} className="bg-background px-3 py-2 border rounded" />
        </div>
        <div className="gap-4 grid grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="font-medium text-sm">Address</label>
            <input name="address" defaultValue={restaurant.address || ''} className="bg-background px-3 py-2 border rounded" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-medium text-sm">Phone</label>
            <input name="phone" defaultValue={restaurant.phone || ''} className="bg-background px-3 py-2 border rounded" />
          </div>
        </div>
        <div className="gap-4 grid grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="font-medium text-sm">Email</label>
            <input name="email" type="email" defaultValue={restaurant.email || ''} className="bg-background px-3 py-2 border rounded" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-medium text-sm">Website</label>
            <input name="website" defaultValue={restaurant.website || ''} className="bg-background px-3 py-2 border rounded" />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="bg-primary px-4 py-2 rounded text-primary-foreground text-sm">Save</button>
          <a href={`/${lang}/dashboard/restaurants/${restaurant.id}`} className="px-4 py-2 border rounded text-sm">Cancel</a>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Link href={`/${lang}/dashboard/restaurants/${restaurant.id}`} className="hover:bg-muted px-3 py-2 border rounded text-xs">{dict.dashboard.restaurants.cancel}</Link>
          <button type="submit" className="bg-primary px-3 py-2 border rounded text-primary-foreground text-xs">{dict.dashboard.restaurants.save}</button>
        </div>
      </form>
    </main>
  );
}
