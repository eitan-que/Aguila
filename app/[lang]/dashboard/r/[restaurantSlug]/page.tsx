import { getDictionary, Lang } from "@/actions/dictionaries";
import { getRestaurantBySlug } from "@/actions/restaurant";
import { SiteHeader } from "@/components/dashboard/siteHeader";
import { RestaurantAnalytics } from "@/components/dashboard/restaurants/RestaurantAnalytics";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ lang: Lang; restaurantSlug: string }>;
}) {
    const { lang, restaurantSlug } = await params
    const dict = await getDictionary(lang)
    let restaurant
    try {
      restaurant = await getRestaurantBySlug(restaurantSlug)
    } catch (error) {
      console.error("Error fetching restaurant by slug:", error)
      restaurant = null
    } finally {
        if (!restaurant?.success || !restaurant?.data) {
            if (restaurant?.message) {
                console.error("Restaurant fetch error:", restaurant.message)
            }
            if (restaurant?.message === "Restaurant not found") {
                notFound()
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
            )
        }
    }

  return (
    <>
      <SiteHeader title={restaurant.data.name || dict.dashboard.restaurants.title} />
      <div className="flex flex-col flex-1 p-4">
        <header className="flex justify-between items-center mb-4">
          <h1 className="font-bold text-2xl">
            {restaurant.data.name || dict.dashboard.restaurants.title}
          </h1>
          <Link href={`/${lang}/dashboard/r/${restaurantSlug}/edit`}>
            <Button>
              <Pencil className="mr-2 w-4 h-4" />
              {dict.dashboard.restaurants.form.actions.edit || "Edit Restaurant"}
            </Button>
          </Link>
        </header>
        <RestaurantAnalytics
          restaurantId={restaurant.data.id}
          restaurantName={restaurant.data.name}
          createdAt={new Date(restaurant.data.createdAt)}
          dict={dict.dashboard}
        />
      </div>
    </>
  )
}