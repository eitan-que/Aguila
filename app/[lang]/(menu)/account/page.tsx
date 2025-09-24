import { getDictionary, Lang, locales } from "@/actions/dictionaries";
import Header from "@/components/shared/header";
import Navbar from "@/components/menu/navbar/navbar";
import { HomeIcon, User } from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ThemeSelector from "@/components/primitives/theme-selector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NameEditor from "@/components/account/name-editor";
import Image from "next/image";

export const revalidate = 3600 // 1 hour

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }))
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ lang: Lang; }>
}) {
  const { lang } = await params
  const dict = await getDictionary(lang)

  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session || !session.user) {
    const callbackUrl = `/${lang}/account/`
    const encoded = encodeURIComponent(callbackUrl)
    redirect(`/${lang}/auth/signin?callbackUrl=${encoded}`)
  }

  return (
    <main className="flex flex-col justify-start items-start gap-8 p-5 w-full min-h-screen">
        <Header
          title={dict.account.title}
        />
        <div className="flex md:flex-row flex-col justify-start items-center md:items-start gap-4 w-full">
          {session.user.image && (
            <div className="relative bg-gray-200 rounded-full w-32 h-32 overflow-hidden">
              <Image
                src={session.user.image}
                alt="Profile Picture"
                fill
                sizes="128px"
                className="object-cover"
                priority
              />
            </div>
          )}
          <div className="flex flex-col justify-start items-start w-full">
            <h2 className="mb-4 font-semibold text-2xl">{dict.account.welcome}, {session.user.name || session.user.email}</h2>
            <p className="text-muted-foreground">{dict.account.description}</p>
          </div>
        </div>
        <div className="flex md:flex-row flex-col justify-start items-start gap-6 w-full">
          <div className="flex flex-col justify-start items-start gap-4 w-full md:w-1/2">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>{dict.account.personalInfo.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <NameEditor 
                  dictionary={dict} 
                  initialName={session.user.name || ""} 
                />
                <div className="flex justify-between items-center pb-2 border-b w-full">
                  <div>
                    <span className="text-muted-foreground">{dict.account.personalInfo.email}: </span>
                    <span className="font-medium">{session.user.email}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="w-full">
              <CardHeader>
                <CardTitle>{dict.account.preferences.theme.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <ThemeSelector dictionary={dict} />
              </CardContent>
            </Card>
          </div>
        </div>
        <Navbar
          items={[
            {
              label: dict.navbar.home,
              url: `/${lang}/`,
              icon: HomeIcon,
              isActive: false
            },
            {
              label: dict.navbar.account,
              url: `/${lang}/account/`,
              icon: User,
              isActive: true
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