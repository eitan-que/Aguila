import { getDictionary, Lang, locales } from "@/actions/dictionaries";
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
      <div className="flex flex-col flex-1"></div>
    </>
  )
}