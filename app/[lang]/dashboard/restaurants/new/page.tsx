import { getDictionary, Lang } from '@/actions/dictionaries';
import { createRestaurant } from '@/actions/restaurant';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

async function create(formData: FormData) {
  'use server';
  const lang = formData.get('lang') as string;
  const data = {
    name: formData.get('name') as string,
    slug: formData.get('slug') as string,
    description: (formData.get('description') as string) || undefined,
    address: (formData.get('address') as string) || undefined,
    phone: (formData.get('phone') as string) || undefined,
    email: (formData.get('email') as string) || undefined,
    website: (formData.get('website') as string) || undefined,
  };
  const res = await createRestaurant(data as any);
  if ('error' in res) {
    redirect(`/${lang}/dashboard/restaurants?error=1`);
  }
  const id = 'restaurant' in res ? (res.restaurant as { id: string }).id : undefined;
  redirect(`/${lang}/dashboard/restaurants/${id}`);
}

export default async function NewRestaurantDashboardPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const session = await auth.api.getSession({ headers: await headers() });
  const role = session?.user?.role;
  if (!(role === 'admin' || role === 'restaurantOwner')) {
    return <div className="p-6 text-sm text-center">{dict.dashboard.error.unauthorizedDescription}</div>;
  }
  return (
    <main className="flex flex-col gap-6 p-6 max-w-xl">
      <h1 className="font-bold text-2xl">{dict.dashboard.restaurants.new}</h1>
      <form action={create} className="flex flex-col gap-4">
        <input type="hidden" name="lang" value={lang} />
        <div className="flex flex-col gap-1">
          <label className="font-medium text-sm">Name</label>
          <input name="name" required className="bg-background px-3 py-2 border rounded" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-medium text-sm">Slug</label>
          <input name="slug" required className="bg-background px-3 py-2 border rounded" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-medium text-sm">Description</label>
          <textarea name="description" className="bg-background px-3 py-2 border rounded" />
        </div>
        <div className="gap-4 grid grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="font-medium text-sm">Address</label>
            <input name="address" className="bg-background px-3 py-2 border rounded" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-medium text-sm">Phone</label>
            <input name="phone" className="bg-background px-3 py-2 border rounded" />
          </div>
        </div>
        <div className="gap-4 grid grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="font-medium text-sm">Email</label>
            <input name="email" type="email" className="bg-background px-3 py-2 border rounded" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-medium text-sm">Website</label>
            <input name="website" className="bg-background px-3 py-2 border rounded" />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="bg-primary px-4 py-2 rounded text-primary-foreground text-sm">Create</button>
          <a href={`/${lang}/dashboard/restaurants`} className="px-4 py-2 border rounded text-sm">Cancel</a>
        </div>
      </form>
    </main>
  );
}
