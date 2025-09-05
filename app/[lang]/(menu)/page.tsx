import { getDictionary, Lang, locales } from "@/actions/dictionaries";
import Header from "@/components/menu/header";
import Navbar from "@/components/menu/navbar/navbar";
import Searchbar from "@/components/menu/searchbar";
import Banner from "@/components/menu/sections/banner";
import Categories from "@/components/menu/sections/categories";
import Category from "@/components/menu/sections/category";
import Restaurants from "@/components/menu/sections/restaurants";
import { Home, User } from "lucide-react";
import { restaurants, categories } from "@/lib/mocks/menu";

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }))
}

export default async function Place({
  params,
}: {
  params: Promise<{ lang: Lang; orgSlug: string; teamSlug: string }>
}) {
  const { lang } = await params
  const dict = await getDictionary(lang)

  return (
    <main className="flex flex-col justify-start items-start gap-8 p-5 w-full min-h-screen">
        <Header
          lang={lang}
        />
        <Searchbar placeholder={dict.menu.search.placeholder} />
        <Banner imageUrl="https://placehold.co/1920x1080/png" />
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
        <Banner imageUrl="https://placehold.co/1920x1080/png" />
        <Categories
          sectionTitle={{
              title: dict.menu.sections.categories,
              viewAll: {
                  label: dict.menu.sections.viewAll
              }
          }}
          lang={lang}
          categories={categories}
        />
        <Category
          lang={lang}
          variant="medium"
          category={categories[0]}
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
        <Category
          lang={lang}
          variant="large"
          category={categories[1]}
        />
        <Navbar
          items={[
            {
              icon: Home,
              label: dict.navbar.home,
              url: `/${lang}/`,
              isActive: true
            },
            {
              icon: User,
              label: dict.navbar.profile,
              url: `/${lang}/profile/`
            }
          ]}
        />
    </main>
  )
}