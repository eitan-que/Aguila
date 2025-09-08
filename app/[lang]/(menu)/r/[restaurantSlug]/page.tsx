import { Lang, locales } from "@/actions/dictionaries"
import Header from "@/components/shared/header";
import DiscountBanners from "@/components/menu/sections/discountBanners";
import { getRestaurantBySlug } from "@/actions/restaurant";
import { getRandomDiscounts } from "@/actions/discounts";
import ContactInfoCard from "@/components/menu/restaurant/ContactInfoCard";
import MenuGallery from "@/components/menu/restaurant/MenuGallery";
import Image from "next/image";

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang, restaurantSlug: "restaurante-1" }))
}

type Restaurant = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    address: string | null;
    categoryId: string | null;
    pictureUrl: string | null;
    pictureAlt: string | null;
    prepTimeMin: number | null;
    prepTimeMax: number | null;
    tags: string[] | null;
    lat: string | null;
    lon: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    menuPictureUrl: string[] | null;
    createdAt: Date;
    updatedAt: Date;
} | null

type Discount = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  restaurantId?: string | null;
};

export default async function Restaurant({
  params,
}: {
  params: Promise<{ lang: Lang; restaurantSlug: string }>
}) {
  const { lang, restaurantSlug } = await params

  const restaurantRes = await getRestaurantBySlug(restaurantSlug);
  const r = restaurantRes.success ? restaurantRes.data : null;

  // Descuentos del restaurante (mostrar todos: usar un límite alto)
  const discountsRes = r?.id
    ? await getRandomDiscounts({ restaurantId: r.id, limit: 1000 })
    : { success: true, data: [] as Discount[] };

  return (
    <main className="relative flex flex-col justify-start items-start gap-8 w-full min-h-screen overflow-x-hidden">
      <Image
        src={r?.pictureUrl || "https://placehold.co/1920x1080/png"}
        alt={r?.pictureAlt || "Banner del Restaurante"}
        width={1920}
        height={1080}
        className="top-0 -z-20 absolute brightness-40 w-full h-72 object-cover"
      />
      <div className="flex flex-col flex-1 justify-start items-center gap-8 p-5 w-full h-full">
        <Header
          title={r?.name || restaurantSlug}
          backUrl={`/${lang}/`}
          share={true}
          textColor="#fff"
        />
        <div className="flex flex-col justify-start items-start gap-4 pt-12 w-full max-w-2xl">
          <h1 className="font-bold text-card dark:text-card-foreground text-3xl">
            {r?.name || "Restaurante"}
          </h1>
          {r?.description && (
            <p className="text-card dark:text-card-foreground text-sm">
              {r.description}
            </p>
          )}
          <ContactInfoCard
            address={r?.address}
            phone={r?.phone}
            email={r?.email}
            website={r?.website}
            coordinates={
              r?.lat != null && r?.lon != null
                ? { lat: parseFloat(r.lat as unknown as string), lon: parseFloat(r.lon as unknown as string) }
                : null
            }
          />
          {discountsRes.data && discountsRes.data.length > 0 && (
            <DiscountBanners discounts={discountsRes.data} />
          )}
          <MenuGallery images={(r as Restaurant)?.menuPictureUrl as string[] | undefined} />
        </div>
      </div>
    </main>
  )
}