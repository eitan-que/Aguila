import { cookies, headers } from "next/headers";
import LoginDialog from "@/components/auth/login-dialog";
import { auth } from "@/lib/auth";
import { getDictionary, Lang, locales } from "@/actions/dictionaries";

export const revalidate = 3600 // 1 hour

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }))
}

export default async function MenuLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: Lang }>;
}) {
  // Check if user has an active session
  const session = await auth.api.getSession({
    headers: await headers()
  });
  const isAuthenticated = !!session?.user;
  const { lang } = await params;
  // Get dictionary for translations
  const dictionary = await getDictionary(lang);

  return (
    <>
      {children}
      {/* Show login dialog only if not authenticated */}
      {!isAuthenticated && <LoginDialog dictionary={dictionary} />}
    </>
  );
}