"use client"
import * as React from "react"
import { ChevronLeft, ChevronRight, Home, Utensils } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import logo from '@/public/logo_256x256_light.png'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Dictionary, Lang } from "@/actions/dictionaries"
import Image from "next/image"
import { NavUser } from "./navUser"

type RestaurantNode = { id: string; name: string; slug: string }

export type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
    restaurants?: RestaurantNode[]
    rootHref?: string
    restaurantHrefBuilder?: (r: RestaurantNode) => string
    lang: Lang
    dict: Dictionary
    user: {
        name: string
        email: string
        avatar?: string
    }
}

export function AppSidebar({
  restaurants = [],
  rootHref = '/dashboard/r',
  restaurantHrefBuilder = (r) => `/dashboard/r/${r.slug}`,
  lang,
  dict,
  user,
  ...props
}: AppSidebarProps) {
  const pathname = usePathname()
  return (
    <Sidebar {...props}>
        <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex justify-center items-center bg-white rounded-lg size-8 aspect-square text-sidebar-primary-foreground">
                  <Image src={logo} alt="Aguila Logo" width={256} height={256} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 grid text-sm text-left leading-tight">
                  <span className="font-semibold truncate">{dict.metadata.title}</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent className="flex flex-col gap-1">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === `/${lang}/dashboard`}
                  className="data-[active=true]:bg-primary data-[active=true]:font-semibold data-[active=true]:text-primary-foreground"
                >
                  <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
                    <Home />
                    <span className="truncate">{dict.dashboard.sidebar.home}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <SidebarMenu>
              <RestaurantsTree
                restaurants={restaurants}
                rootHref={rootHref}
                restaurantHrefBuilder={restaurantHrefBuilder}
                dict={dict.dashboard.sidebar}
                lang={lang}
                pathName={pathname}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser
            user={user}
            dict={dict.dashboard.sidebar.navuser}
        />
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/" className="flex items-center gap-2 py-5 overflow-hidden">
                        <ChevronLeft />
                        <span className="truncate">{dict.dashboard.sidebar.backToSite}</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

function RestaurantsTree({
    restaurants,
    rootHref,
    restaurantHrefBuilder,
    dict,
    lang,
    pathName
}: {
    restaurants: RestaurantNode[]
    rootHref: string
    restaurantHrefBuilder: (r: RestaurantNode) => string
    dict: Dictionary["dashboard"]["sidebar"]
    lang: Lang
    pathName: string
}) {
  // Sin restaurantes: solo mostrar el root con ícono
  if (!restaurants.length) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton 
            className="data-[active=true]:bg-primary data-[active=true]:font-semibold data-[active=true]:text-primary-foreground" 
            asChild
            isActive={pathName === `/${lang}/dashboard/r`}
        >
            <Link href={rootHref} className="flex items-center gap-2 overflow-hidden">
                <Utensils />
                <span className="truncate">{dict.restaurants}</span>
            </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <SidebarMenuItem>
      <Collapsible className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90" defaultOpen>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton 
            className="data-[active=true]:bg-primary data-[active=true]:font-semibold data-[active=true]:text-primary-foreground" 
            asChild
            isActive={pathName === `/${lang}/dashboard/r`}
          >
            <Link href={rootHref} className="flex items-center gap-2 overflow-hidden">
              <ChevronRight className="transition-transform" />
              <Utensils />
              <span className="truncate">Restaurants</span>
            </Link>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {restaurants.map(r => (
              <SidebarMenuItem key={r.id}>
                <SidebarMenuButton 
                    asChild
                    isActive={pathName === `/${lang}/dashboard/r/${r.slug}`}
                    className="data-[active=true]:bg-primary data-[active=true]:font-semibold data-[active=true]:text-primary-foreground"
                >
                  <Link href={restaurantHrefBuilder(r)} className="flex items-center overflow-hidden">
                    <span className="max-w-[160px] truncate" title={r.name}>{r.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  )
}