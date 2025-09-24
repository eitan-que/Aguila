import { getDictionary, Lang } from "@/actions/dictionaries";
import { listRestaurants } from "@/actions/restaurant";
import { AppSidebar } from "@/components/dashboard/sidebar/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: Lang; }>
}>) {
    const { lang } = await params;
    const dict = await getDictionary(lang)
    
    // Authentication check
    const session = await auth.api.getSession({
        headers: await headers(),
    })
    
    if (!session?.user) {
        // Redirect to sign-in page with callback URL
        redirect(`/${lang}/auth/signin?callbackUrl=/${lang}/dashboard`);
    }
    
    // Role check - only allow admin and restaurantOwner roles
    const hasValidRole = session.user.role === "admin" || session.user.role === "restaurantOwner";
    if (!hasValidRole) {
        redirect(`/${lang}`);
    }
    
    // User is authenticated and has valid role
    const user = session.user;

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