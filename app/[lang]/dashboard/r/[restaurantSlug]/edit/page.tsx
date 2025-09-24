import { getDictionary, Lang } from "@/actions/dictionaries";
import { getRestaurantBySlug } from "@/actions/restaurant";
import { SiteHeader } from "@/components/dashboard/siteHeader";
import { EditRestaurantForm } from "@/components/dashboard/forms/editRestaurant";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EditRestaurantPage({
  params,
}: {
  params: Promise<{ lang: Lang; restaurantSlug: string }>;
}) {
  const { lang, restaurantSlug } = await params;
  const dict = await getDictionary(lang);
  
  let restaurant;
  try {
    restaurant = await getRestaurantBySlug(restaurantSlug);
  } catch (error) {
    console.error("Error fetching restaurant by slug:", error);
    restaurant = null;
  } finally {
    if (!restaurant?.success || !restaurant?.data) {
      if (restaurant?.message) {
        console.error("Restaurant fetch error:", restaurant.message);
      }
      if (restaurant?.message === "Restaurant not found") {
        notFound();
      }
      return (
        <>
          <SiteHeader title={dict.dashboard.restaurants.title} />
          <div className="flex flex-col flex-1 p-4">
            <header className="flex justify-between items-center mb-4">
              <h1 className="font-bold text-2xl">
                {dict.dashboard.restaurants.title}
              </h1>
            </header>
            <p className="text-red-500">Error loading restaurant data. Please try again later.</p>
          </div>
        </>
      );
    }
  }

  return (
    <>
      <SiteHeader title={`${dict.dashboard.restaurants.form.actions.update} - ${restaurant.data.name}`} />
      <div className="flex flex-col flex-1 p-4">
        <header className="flex justify-between items-center mb-4">
          <h1 className="font-bold text-2xl">
            {dict.dashboard.restaurants.form.actions.update}
          </h1>
        </header>
        
        <Card>
          <CardHeader>
            <CardTitle>{restaurant.data.name}</CardTitle>
            <CardDescription>
              {dict.dashboard.restaurants.form.editDescription || "Update restaurant information below."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EditRestaurantForm
              restaurant={{
                id: restaurant.data.id,
                name: restaurant.data.name ?? undefined,
                slug: restaurant.data.slug ?? undefined,
                description: restaurant.data.description ?? undefined,
                address: restaurant.data.address ?? undefined,
                pictureUrl: restaurant.data.pictureUrl ?? undefined,
                pictureAlt: restaurant.data.pictureAlt ?? undefined,
                prepTimeMin: restaurant.data.prepTimeMin ?? undefined,
                prepTimeMax: restaurant.data.prepTimeMax ?? undefined,
                tags: restaurant.data.tags ?? undefined,
                phone: restaurant.data.phone ?? undefined,
                email: restaurant.data.email ?? undefined,
                website: restaurant.data.website ?? undefined,
                menuPictureUrl: restaurant.data.menuPictureUrl ?? undefined
              }}
              t={dict.dashboard.restaurants.form}
              // onSuccess={() => redirect(`/${lang}/dashboard/r/${restaurantSlug}`)}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}