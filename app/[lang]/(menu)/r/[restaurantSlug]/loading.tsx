import { HeaderSkeleton } from "@/components/shared/header";
import { BannerSkeleton } from "@/components/menu/sections/banner";
import { CategoriesSkeleton } from "@/components/menu/sections/categories";
import { CategorySkeleton } from "@/components/menu/sections/category";

export default function Loading() {
  return (
    <main className="flex flex-col justify-center items-center gap-8 p-5 w-full min-h-screen overflow-y-hidden">
        <HeaderSkeleton backButton/>
        <BannerSkeleton />
        <CategoriesSkeleton />
        <CategorySkeleton variant="large" />
        <BannerSkeleton />
        <CategorySkeleton variant="grid" />
        <CategorySkeleton variant="list" />
        {/* <NavbarSkeleton /> */}
    </main>
  )
}
