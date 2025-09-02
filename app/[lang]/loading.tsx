import { HeaderSkeleton } from "@/components/menu/header";
import { NavbarSkeleton } from "@/components/menu/navbar/navbar";
import { SearchbarSkeleton } from "@/components/menu/searchbar";
import { BannerSkeleton } from "@/components/menu/sections/banner";
import { CategoriesSkeleton } from "@/components/menu/sections/categories";
import { CategorySkeleton } from "@/components/menu/sections/category";
import { RestaurantsSkeleton } from "@/components/menu/sections/restaurants";

export default function Loading() {
  return (
    <main className="flex flex-col justify-center items-center gap-8 p-5 w-full min-h-screen overflow-y-hidden">
        <HeaderSkeleton />
        <SearchbarSkeleton />
        <BannerSkeleton />
        <RestaurantsSkeleton />
        <BannerSkeleton />
        <CategoriesSkeleton />
        <CategorySkeleton variant="medium" />
        <RestaurantsSkeleton variant="secondary" />
        <CategorySkeleton variant="large" />
        <NavbarSkeleton />
    </main>
  )
}
