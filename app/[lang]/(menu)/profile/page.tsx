import { getDictionary, Lang, locales } from "@/actions/dictionaries";
import Header from "@/components/menu/header";
import Navbar from "@/components/menu/navbar/navbar";
import { Home, LayoutDashboard, User } from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NavbarItemProps } from "@/components/menu/navbar/navbarItem";
import { redirect } from "next/navigation";

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }))
}

export default async function Profile({
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

  if (!session) {
    redirect(`/${lang}/auth/signin`)
  }

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
          lang={lang}
        />
        
        <Navbar
          items={navItems}
        />
    </main>
  )
}