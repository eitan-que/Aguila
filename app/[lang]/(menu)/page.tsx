import { getDictionary, Lang, locales } from "@/actions/dictionaries";
import Header from "@/components/shared/header";
import Navbar from "@/components/menu/navbar/navbar";
import Banner from "@/components/menu/sections/banner";
import Categories from "@/components/menu/sections/categories";
import Category from "@/components/menu/sections/category";
import Restaurants from "@/components/menu/sections/restaurants";
import { Home, LayoutDashboard, User } from "lucide-react";
import { restaurants, categories } from "@/lib/mocks/menu";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NavbarItemProps } from "@/components/menu/navbar/navbarItem";

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
  const session = await auth.api.getSession({
    headers: await headers()
  })
  const navItems: NavbarItemProps[] = [
    {
      icon: Home,
      label: dict.navbar.home,
      url: `/${lang}/` as NavbarItemProps["url"],
      isActive: true
    },
    {
      icon: User,
      label: dict.navbar.profile,
      url: `/${lang}/profile/` as NavbarItemProps["url"]
    }
  ]

  if ((session && session.user.role === 'admin') || session?.user.role === 'restaurantOwner') {
    navItems.push({
      icon: LayoutDashboard,
      label: "Dashboard",
      url: `/${lang}/dashboard/` as NavbarItemProps["url"]
    })
  }

  return (
    <main className="flex flex-col justify-start items-start gap-8 p-5 w-full min-h-screen">
        <Header
          share={true}
        />
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
          items={navItems}
        />
    </main>
  )
}