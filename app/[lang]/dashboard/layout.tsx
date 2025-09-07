import { getDictionary, Lang } from "@/actions/dictionaries";
import { listRestaurants } from "@/actions/restaurant";
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
  params: Promise<{ lang: Lang; }>
}>) {
    const { lang } = await params;
    const dict = await getDictionary(lang)
    const sessionData = await auth.api.getSession({
        headers: await headers(),
    })
    if (!sessionData?.user) {
        redirect('/auth/signin');
    }
    const user = sessionData?.user

    const restaurants = await listRestaurants();
    if (!restaurants.success || !restaurants.data) {
        console.error("Error fetching restaurants:", restaurants.message);
    }
    
    return (
        <SidebarProvider>
            <AppSidebar 
                lang={lang} 
                variant="inset" 
                dict={dict} 
                restaurants={restaurants.data}
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