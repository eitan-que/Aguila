import { getDictionary, Lang, locales } from "@/actions/dictionaries";
import { DrawerDialogTemplate } from "@/components/dashboard/drawerDialogTemplate";
import { CreateRestaurantForm } from "@/components/dashboard/forms/createRestaurant";
import { RestaurantsList } from "@/components/dashboard/restaurants/restaurantsList";
import { SiteHeader } from "@/components/dashboard/siteHeader";

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }))
}

export default async function Place({
  params,
}: {
  params: Promise<{ lang: Lang; }>
}) {
  const { lang } = await params
  const dict = await getDictionary(lang)

  return (
    <>
      <SiteHeader title={dict.dashboard.restaurants.title} />
      <div className="flex flex-col flex-1 p-4">
        <header className="flex justify-between items-center mb-4">
          <h1 className="font-bold text-2xl">
            {dict.dashboard.restaurants.title}
          </h1>
          <DrawerDialogTemplate 
            triggerText={dict.dashboard.restaurants.add?.trigger || "Add Restaurant"}
            title={dict.dashboard.restaurants.add?.title || "Add Restaurant"}
            description={dict.dashboard.restaurants.add?.description || "Add your restaurant details and start gaining customers today."}
            form={<CreateRestaurantForm {...dict.dashboard.restaurants.form} />}
          />
        </header>
        <RestaurantsList t={dict.dashboard.restaurants.list} />
      </div>
    </>
  )
}