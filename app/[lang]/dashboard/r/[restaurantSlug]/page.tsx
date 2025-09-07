import { getDictionary, Lang, locales } from "@/actions/dictionaries";
import { getRestaurantBySlug } from "@/actions/restaurant";
import { SiteHeader } from "@/components/dashboard/siteHeader";
import { RestaurantAnalytics } from "@/components/dashboard/restaurants/RestaurantAnalytics";
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