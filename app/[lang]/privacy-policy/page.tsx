import { Dictionary, getDictionary, Lang, locales } from "@/actions/dictionaries";
import Header from "@/components/shared/header";

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }))
}

type SectionProps = {
    id: string;
    title: string;
    body: string[];
    points?: string[];
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ lang: Lang; }>
}) {
  const { lang } = await params
  const dict = await getDictionary(lang)
  const privacy = (dict as Dictionary)?.legal?.privacy

  return (
    <main className="flex flex-col justify-start items-center gap-8 p-5 w-full min-h-screen">
      <Header
        title={dict.metadata.title}
        backUrl={`/${lang}/auth/signin`}
        share={true}
      />
      <div className="space-y-8 w-full max-w-3xl">
        <h1 className="font-bold text-2xl">{privacy?.title}</h1>
        {privacy?.sections?.map((section: SectionProps) => (
          <section key={section.id} className="space-y-3">
            <h2 className="font-semibold text-lg">{section.title}</h2>
            {section.body?.map((p: string, idx: number) => (
              <p key={idx} className="text-muted-foreground text-sm leading-relaxed">
                {p}
              </p>
            ))}
            {section.points?.length ? (
              <ul className="space-y-1 pl-6 text-muted-foreground text-sm list-disc">
                {section.points.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </main>
  )
}