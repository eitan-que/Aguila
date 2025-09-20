import { getDictionary, Lang, locales } from "@/actions/dictionaries";
import Header from "@/components/shared/header";
import { getMenuRestaurants } from "@/actions/restaurant";
import Banner4List from "@/components/menu/restaurant/banner4List";

export const revalidate = 3600 // 1 hour

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }))
}

export default async function RestaurantsPage({
  params,
}: {
  params: Promise<{ lang: Lang; }>
}) {
  const { lang } = await params
  const dict = await getDictionary(lang)

  // Cargar restaurantes desde la server action (orden aleatorio y distancia calculada)
  const { data: restaurants = [] } = await getMenuRestaurants();

  return (
    <main className="flex flex-col justify-start items-start gap-8 p-5 w-full min-h-screen">
        <Header
          share={true}
          title={dict.menu.sections.restaurants}
          backUrl={`/${lang}`}
        />
        {restaurants.map((restaurant) => (
          <Banner4List
            key={restaurant.id}
            lang={lang}
            restaurant={restaurant}
          />
        ))}
        {/* <Navbar
          items={navItems}
        /> */}
    </main>
  )
}