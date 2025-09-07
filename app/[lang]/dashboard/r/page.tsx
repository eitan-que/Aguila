import { getDictionary, Lang, locales } from "@/actions/dictionaries";
import { DrawerDialogTemplate } from "@/components/dashboard/drawerDialogTemplate";
import { CreateRestaurantForm } from "@/components/dashboard/forms/createRestaurant";
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
            triggerText="Add Restaurant"
            title={"Add Restaurant"}
            description={"Add your restaurant details and start gaining customers today."}
            form={<CreateRestaurantForm {...dict.dashboard.restaurants.form} />}
          />
          
        </header>
      </div>
    </>
  )
}