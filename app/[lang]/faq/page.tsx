import { Dictionary, getDictionary, Lang, locales } from "@/actions/dictionaries";
import Navbar from "@/components/menu/navbar/navbar";
import { renderTextWithActions } from "@/components/primitives/dicTextWithAction";
import Header from "@/components/shared/header";
import { HomeIcon, User } from "lucide-react";

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }))
}

type SectionProps = {
    id: string;
    question: string;
    answer: string;
}

export default async function FAQPage({
  params,
}: {
  params: Promise<{ lang: Lang; }>
}) {
  const { lang } = await params
  const dict = await getDictionary(lang)
  const faq = (dict as Dictionary)?.legal?.faq

  return (
    <main className="flex flex-col justify-start items-center gap-8 p-5 w-full min-h-screen">
      <Header
        title={dict.metadata.title}
        share={true}
      />
      <div className="space-y-8 w-full max-w-3xl">
        <h1 className="font-bold text-2xl">{faq?.title}</h1>
        {faq?.sections?.map((section: SectionProps) => (
          <section key={section.id} className="space-y-3">
            <h2 className="font-semibold text-lg">{section.question}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {section.answer.includes("##") ? renderTextWithActions({
                text: section.answer,
                as: "link",
                href: section.id === "PrivacidadDatos" ? `/${lang}/privacy-policy` : section.id === "ProblemasTecnicos" ? `mailto:aguila.startup@gmail.com` : `/${lang}/`,
              }) : section.answer}
            </p>
          </section>
        ))}
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
                isActive: false
            },
            {
                label: dict.navbar.aguila,
                url: `/${lang}/faq/`,
                icon: "aguila",
                isActive: true
            }
            ]}
        />
    </main>
  )
}