import { getDictionary, Lang } from '@/actions/dictionaries';
import { createRestaurant } from '@/actions/restaurant';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { PageHeader } from '@/components/dashboard/page-header';
import { PageShell } from '@/components/dashboard/page-shell';

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
    <PageShell className="max-w-xl">
      <PageHeader title={dict.dashboard.restaurants.new} backHref={`/${lang}/dashboard/restaurants`} backLabel={`← ${dict.dashboard.restaurants.back}`} />
      <form action={create} className="flex flex-col gap-5">
        <input type="hidden" name="lang" value={lang} />
        <Field label="Name"><input name="name" required className="bg-background px-3 py-2 border rounded outline-none ring-primary/50 focus-visible:ring-2 transition" /></Field>
        <Field label="Slug"><input name="slug" required className="bg-background px-3 py-2 border rounded outline-none ring-primary/50 focus-visible:ring-2 transition" /></Field>
        <Field label="Description"><textarea name="description" className="bg-background px-3 py-2 border rounded outline-none ring-primary/50 focus-visible:ring-2 min-h-24 transition" /></Field>
        <div className="gap-4 grid grid-cols-2 max-sm:grid-cols-1">
          <Field label="Address"><input name="address" className="bg-background px-3 py-2 border rounded outline-none ring-primary/50 focus-visible:ring-2 transition" /></Field>
          <Field label="Phone"><input name="phone" className="bg-background px-3 py-2 border rounded outline-none ring-primary/50 focus-visible:ring-2 transition" /></Field>
        </div>
        <div className="gap-4 grid grid-cols-2 max-sm:grid-cols-1">
          <Field label="Email"><input name="email" type="email" className="bg-background px-3 py-2 border rounded outline-none ring-primary/50 focus-visible:ring-2 transition" /></Field>
          <Field label="Website"><input name="website" className="bg-background px-3 py-2 border rounded outline-none ring-primary/50 focus-visible:ring-2 transition" /></Field>
        </div>
        <div className="flex gap-2 pt-2">
          <button type="submit" className="bg-primary hover:opacity-90 px-4 py-2 border border-primary rounded text-primary-foreground text-sm transition">{dict.dashboard.restaurants.create}</button>
          <a href={`/${lang}/dashboard/restaurants`} className="hover:bg-muted px-4 py-2 border rounded text-sm transition">{dict.dashboard.restaurants.cancel}</a>
        </div>
      </form>
    </PageShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 font-medium text-sm">
      <span className="font-normal text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
