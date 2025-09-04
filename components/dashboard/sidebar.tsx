"use client";
import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth-client";
import { LayoutDashboard, File, Folder, ChevronRight, LogOut, ArrowLeft } from "lucide-react";
import { type Dictionary } from "@/actions/dictionaries";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuSub, SidebarMenuBadge, SidebarRail } from "@/components/ui/sidebar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

interface SidebarCategory { id: string; name: string }
interface SidebarRestaurant { id: string; name: string; slug: string; categories: SidebarCategory[] }
interface AdminSidebarProps { dict: Dictionary; lang: string; role: string; restaurants: SidebarRestaurant[] }

export function AdminSidebar({ dict, lang, role, restaurants }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const visibleRestaurants = role === 'restaurantOwner' ? restaurants.slice(0,1) : restaurants;
  return (
    <div className="hidden md:flex">
      <Sidebar className="gap-4">
        <SidebarContent className="flex flex-col gap-6">
          <SidebarGroup>
            <SidebarGroupLabel><Link href={`/${lang}/dashboard`}>{dict.dashboard.sidebar.dashboard}</Link></SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Link href={`/${lang}/dashboard`} className="block">
                    <SidebarMenuButton isActive={pathname === `/${lang}/dashboard`}> 
                      <LayoutDashboard className="w-4 h-4" /> {dict.dashboard.sidebar.dashboard}
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>
              <Link href={`/${lang}/dashboard/restaurants`}>{dict.dashboard.sidebar.restaurants}</Link>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleRestaurants.map(r => (
                  <Tree key={r.id} restaurant={r} lang={lang} pathname={pathname} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <div className="flex flex-col gap-3 mt-auto pt-4 border-t">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs uppercase tracking-wide">Session</SidebarGroupLabel>
              <SidebarGroupContent className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="justify-start w-full text-red-600 hover:text-red-700"
                  onClick={async () => { await signOut({ fetchOptions: { onSuccess: () => { router.push('/auth/signin'); } } }); }}
                >
                  <LogOut className="w-4 h-4" /> {dict.dashboard.sidebar.logout}
                </Button>
                <Button variant="ghost" className="justify-start w-full" asChild>
                  <Link href={`/${lang}`}><ArrowLeft className="w-4 h-4" /> {dict.dashboard.sidebar.backToSite}</Link>
                </Button>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    </div>
  );
}

function Tree({ restaurant, lang, pathname }: { restaurant: SidebarRestaurant; lang: string; pathname: string }) {
  const hasChildren = restaurant.categories.length > 0;
  const active = pathname.startsWith(`/${lang}/dashboard/restaurants/${restaurant.id}`) || pathname.includes(restaurant.slug);
  return (
    <SidebarMenuItem>
      <Collapsible defaultOpen className="group/collapsible">
        <div className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-default ${active ? 'bg-accent/60' : 'hover:bg-accent/40'}`}>
          {hasChildren ? (
            <CollapsibleTrigger asChild>
              <button aria-label="toggle" className="inline-flex justify-center items-center p-0 rounded hover:text-primary transition-colors">
                <ChevronRight className="w-4 h-4 group-data-[state=open]:rotate-90 transition-transform" />
              </button>
            </CollapsibleTrigger>
          ) : (
            <span className="w-4 h-4" />
          )}
          <Folder className="w-4 h-4 text-muted-foreground" />
          <Link href={`/${lang}/dashboard/restaurants/${restaurant.id}`} className="flex-1 hover:underline truncate">
            {restaurant.name}
          </Link>
          <SidebarMenuBadge>{restaurant.categories.length}</SidebarMenuBadge>
        </div>
        {hasChildren && (
          <CollapsibleContent>
            <SidebarMenuSub>
              <li>
                <Link href={`/${lang}/dashboard/restaurants/${restaurant.id}`}>
                  <SidebarMenuButton isActive={pathname.startsWith(`/${lang}/dashboard/restaurants/${restaurant.id}`)} className="data-[active=true]:bg-transparent">
                    <File className="w-4 h-4" /> Overview
                  </SidebarMenuButton>
                </Link>
              </li>
              {restaurant.categories.map(c => (
                <li key={c.id}>
                  <Link href={`/${lang}/dashboard/restaurants/${restaurant.id}?category=${c.id}`}>
                    <SidebarMenuButton isActive={pathname.includes(c.id)} className="data-[active=true]:bg-transparent">
                      <File className="w-4 h-4" /> {c.name}
                    </SidebarMenuButton>
                  </Link>
                </li>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        )}
      </Collapsible>
    </SidebarMenuItem>
  );
}
