import { Resend } from 'resend'
import { EmailTemplate } from '@/components/email/signin-template'
import { auth } from '@/lib/auth'
import { cookies, headers } from 'next/headers'
import { getDictionary, Lang } from '@/actions/dictionaries'

const resend = new Resend(process.env.AUTH_RESEND_KEY)

export async function sendMagicLink({
  email,
  token,
  url
}: {
  email: string,
  token: string,
  url: string
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    const value = `{"email":"${email}"}`
    const username = session?.user?.name || email.split('@')[0]

    // Extract language from URL or default to 'en'
    let lang: Lang = 'en' // Default language
    const cookieStore = await cookies()
    try {
      const langCookie = cookieStore.get("lang");
      if (langCookie) {
        lang = langCookie.value as Lang;
      }
    } catch {
      lang = 'en'
    } finally {
      cookieStore.delete("lang")
    }

    const dict = await getDictionary(lang)

    // Nuevo: determina el remitente según entorno
    const appName = process.env.APP_NAME || 'Aguila'
    const appDomain = process.env.APP_DOMAIN || 'restoman.tech'
    const fromAddress =
      process.env.NODE_ENV === 'development'
        ? `${appName} <onboarding@resend.dev>`
        : `${appName} <noreply@${appDomain}>`

    await resend.emails.send({
      from: fromAddress,
      to: email,
      subject: `${dict.email.signInSubject} - ${appName}`,
      react: await EmailTemplate({
        username,
        url,
        productName: appName,
        dict
      }),
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending verification email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send verification email'
    }
  }

}

