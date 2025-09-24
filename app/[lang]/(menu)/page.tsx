import { getDictionary, Lang, locales } from "@/actions/dictionaries";
import Header from "@/components/shared/header";
import Restaurants from "@/components/menu/sections/restaurants";
import DiscountBanners from "@/components/menu/sections/discountBanners";
import { getRandomDiscounts } from "@/actions/discounts";
import { getMenuRestaurants } from "@/actions/restaurant";
import Navbar from "@/components/menu/navbar/navbar";
import { HomeIcon, User } from "lucide-react";

export const revalidate = 3600 // 1 hour

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }))
}

export default async function Home({
  params,
}: {
  params: Promise<{ lang: Lang; }>
}) {
  const { lang } = await params
  const dict = await getDictionary(lang)

  const discounts0 = await getRandomDiscounts({
    limit: 3
  })

  const discounts1 = await getRandomDiscounts({
    limit: 3
  })

  // Cargar restaurantes desde la server action (orden aleatorio y distancia calculada)
  const { data: restaurants = [] } = await getMenuRestaurants();

  return (
    <main className="flex flex-col justify-start items-start gap-8 p-5 w-full min-h-screen">
        <Header
          share={true}
        />
        <DiscountBanners
          discounts={discounts0.data}
          asLinkToRestaurant={true}
        />
        <Restaurants
          sectionTitle={{
              title: dict.menu.sections.restaurants,
              viewAll: {
                  label: dict.menu.sections.viewAll
              }
          }}
          lang={lang}
          restaurants={restaurants}
        />
        <DiscountBanners
          discounts={discounts1.data}
          asLinkToRestaurant={true}
        />
        <Restaurants
          sectionTitle={{
              title: dict.menu.sections.restaurants,
              viewAll: {
                  label: dict.menu.sections.viewAll
              }
          }}
          lang={lang}
          restaurants={restaurants}
          variant="secondary"
        />
        <Navbar
          items={[
            {
              label: dict.navbar.home,
              url: `/${lang}/`,
              icon: HomeIcon,
              isActive: true
            },
            {
              label: dict.navbar.account,
              url: `/${lang}/account/`,
              icon: User,
              isActive: false
            },
            {
              label: dict.navbar.aguila,
              url: `/${lang}/faq/`,
              icon: "aguila",
              isActive: false
            }
          ]}
        />
    </main>
  )
}