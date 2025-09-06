import { getDictionary, Lang, locales } from "@/actions/dictionaries"
import Header from "@/components/menu/header";
import Navbar from "@/components/menu/navbar/navbar";
import Banner from "@/components/menu/sections/banner";
import Categories from "@/components/menu/sections/categories";
import Category from "@/components/menu/sections/category";
import { Home, User } from "lucide-react";
import { categories } from "@/lib/mocks/menu"; // antes: ../../page

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang, restaurantSlug: "restaurante-1" }))
}

export default async function Restaurant({
  params,
}: {
  params: Promise<{ lang: Lang; restaurantSlug: string }>
}) {
  const { lang, restaurantSlug } = await params
  
  // Continue with the rest of your component
  const dict = await getDictionary(lang)

  // generar anchorIds únicos (cat.id + índice)
  const anchors = categories.map((c, i) => ({
    originalId: c.id,
    anchorId: `${c.id}-${i}`
  }))

  return (
    <main className="flex flex-col justify-start items-start gap-8 p-5 w-full min-h-screen">
      <Header
        title={restaurantSlug}
        backUrl={`/${lang}/`}
      />
      <Banner imageUrl="https://placehold.co/1920x1080/png" restaurant={{ name: "Restaurant Name", location: "Calle 123", coordinates: { lat: 0, lon: 0 }, prepTimeRange: { min: 10, max: 30 }, tags: ["tag1", "tag2"] }} />
      <Categories
        sectionTitle={{
          title: dict.menu.sections.categories,
          viewAll: {
            label: dict.menu.sections.viewAll,
          }
        }}
        lang={lang}
        categories={categories}
        isFromRestaurant
        anchors={anchors}
      />
      <Category
        lang={lang}
        variant="large"
        category={categories[0]}
        anchorId={anchors[0].anchorId}
      />
      <Banner imageUrl="https://placehold.co/1920x1080/png"/>
      <Category
        lang={lang}
        variant="grid"
        category={categories[1]}
        anchorId={anchors[1].anchorId}
      />
      <Category
        lang={lang}
        variant="list"
        category={categories[2]}
        bestSellerLabel={dict.menu.tags.bestSeller}
        anchorId={anchors[2].anchorId}
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