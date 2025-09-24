import { getDictionary, Lang, locales } from "@/actions/dictionaries"
import SignInPageClient from "@/components/auth/signin-page-client"


export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function SignIn({
  params,
  searchParams
}: {
  params: Promise<{ lang: Lang; }>
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const { lang } = await params
  const { callbackUrl } = await searchParams
  const dict = await getDictionary(lang)

  return (
    <main className="flex flex-col justify-start items-center gap-8 py-5 w-full min-h-screen">
      <SignInPageClient lang={lang} dict={dict} callbackUrl={callbackUrl} />
    </main>
  )
}


