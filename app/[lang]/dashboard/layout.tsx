import { getDictionary, Lang } from "@/actions/dictionaries";
import { AppSidebar } from "@/components/dashboard/sidebar/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { lang: Lang }
}>) {
    const { lang } = params;
    const dict = await getDictionary(lang)
    const sessionData = await auth.api.getSession({
        headers: await headers(),
    })
    if (!sessionData?.user) {
        redirect('/auth/signin');
    }
    const user = sessionData?.user
    
    return (
        <SidebarProvider>
            <AppSidebar 
                lang={lang} 
                variant="inset" 
                dict={dict} 
                restaurants={[
                    { id: '1', name: 'Demo Restaurant', slug: 'demo-restaurant' }
                ]}
                user={{
                    name: user?.name,
                    email: user?.email,
                    avatar: user?.image || undefined,
                }}
            />
            <SidebarInset>
                {children}
            </SidebarInset>
        </SidebarProvider>
    );
}