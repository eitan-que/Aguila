"use client"

import { useState } from "react"
import Header from "@/components/shared/header"
import { SignInForm } from "@/components/auth/signin"
import type { Dictionary, Lang } from "@/actions/dictionaries"

type Props = {
  lang: Lang
  // Tip: replace `any` with your dict type if you have it exported
  dict: Dictionary
}

export default function SignInPageClient({ lang, dict }: Props) {
  const [emailSent, setEmailSent] = useState(false)

  return (
    <>
      <Header
        title={dict.metadata.title}
        backUrl={emailSent ? "goBack" : `/${lang}/`}
      />
      <div className="flex flex-col flex-1 justify-center items-center p-4 sm:p-6 lg:p-8">
        <SignInForm dict={dict} lang={lang} onEmailSent={() => setEmailSent(true)} />
      </div>
    </>
  )
}