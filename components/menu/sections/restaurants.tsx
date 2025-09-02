import { Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import SectionsTitle, { SectionsTitleSkeleton } from "@/components/menu/sections/sectionsTitle";
import { Skeleton } from "@/components/ui/skeleton";
import TagComponent, { PrimitiveTag, TagSkeleton } from "@/components/menu/primitives/tag";
import OnImageItems from "@/components/menu/primitives/onImageItems";

type RestaurantsProps = {
    sectionTitle: {
        title: string;
        viewAll: {
            label: string;
        }
    };
    lang: string;
    restaurants: Restaurant[];
    variant?: "primary" | "secondary";
};

type Place = { 
    id: string;
    name: string;
    slug: string;
}

type Tag = {
    type: "text";
    text?: string;
}

export type Restaurant = {
    id: string;
    name: string;
    slug: string;
    picture: {
        src: string;
        alt: string;
    };
    prepTimeRange?: {
        min: number;
        max: number;
    };
    highestPercentageDiscount?: number;
    weight: number;
    categories?: {
        name: string;
        id: string;
        weight: number;
    }[];
    tags?: Tag[];
};

export default function Restaurants(
    {
        sectionTitle,
        lang,
        restaurants,
        variant = "primary",
    } : RestaurantsProps
) {

    if (!restaurants || restaurants.length === 0) {
        return null;
    }
    // Ordenar por peso (desc) y dividir en destacados (2) y restantes
    const sorted = [...(restaurants ?? [])].sort((a, b) => b.weight - a.weight);
    const featured = sorted.slice(0, 2);
    const others = sorted.slice(2);

    const getTopCategory = (r: Restaurant) =>
        r.categories?.length
        ? r.categories.reduce((prev, cur) => (cur.weight > prev.weight ? cur : prev), r.categories[0])
        : undefined;

    return (
        <section className="flex flex-col gap-4 w-full">
            <SectionsTitle
                title={sectionTitle.title}
                viewAll={{
                    url: `/${lang}/r/`,
                    label: sectionTitle.viewAll.label
                }}
            />
            {variant === "primary" && (
                <>
                    {/* Primeros 2, tarjetas grandes */}
                    <div className="gap-4 grid grid-cols-2 w-full">
                        {featured.map((r) => {
                            return (
                            <Link
                                key={r.id}
                                href={`/${lang}/r/${r.slug}`}
                                className="flex flex-col gap-1.5 col-span-1"
                            >
                                <Image
                                    src={r.picture.src}
                                    alt={r.picture.alt || r.name}
                                    width={865}
                                    height={560}
                                    className="bg-card rounded-lg w-full object-cover aspect-[865/560]"
                                />
                                <div className="flex flex-col gap-1 px-1">
                                    <h3 className="font-bold text-sm/4">{r.name}</h3>
                                    {r.prepTimeRange && (
                                        <PrimitiveTag
                                            Icon={Clock}
                                            text={`${r.prepTimeRange!.min}-${r.prepTimeRange!.max} min`}
                                            textColor="text-muted-foreground"
                                            backgroundColor="bg-transparent"
                                        />
                                    )}
                                </div>
                            </Link>
                        )})}
                    </div>
                    {/* Resto en scroller horizontal */}
                    <div className="flex justify-start items-start gap-4 w-full overflow-x-auto snap-mandatory snap-x">
                        {others.map((r) => {
                            const topCategory = getTopCategory(r);
                            const avg = Math.round((r.prepTimeRange!.min + r.prepTimeRange!.max) / 2)
                            return (
                            <Link
                                key={r.id}
                                href={`/${lang}/r/${r.slug}`}
                                className="flex flex-col gap-1.5 w-2/5 snap-start shrink-0"
                            >
                                <div className="relative w-full h-auto">
                                    <div className={`top-0 left-0 absolute flex flex-col justify-start items-end gap-1 p-2 w-full h-full`}> 
                                        {r.prepTimeRange && (
                                            <TagComponent
                                                tag={{
                                                    type: "time",
                                                    time: avg || 0
                                                }}
                                            />
                                        )}
                                    </div>
                                    <Image
                                        src={r.picture.src}
                                        alt={r.picture.alt || r.name}
                                        width={650}
                                        height={480}
                                        className="bg-card rounded-lg w-full object-cover aspect-[650/480]"
                                    />
                                </div>
                                <div className="flex flex-col items-center gap-0.5">
                                    <h3 className="font-bold text-sm/4 text-center">{r.name}</h3>
                                    {topCategory?.name && (
                                        <p className="text-muted-foreground text-xs/4 text-center">{topCategory.name}</p>
                                    )}
                                </div>
                            </Link>
                        )})}
                    </div>
                </>
            )}
            {variant === "secondary" && (
                <>
                    <div className="flex justify-start items-start gap-4 w-full overflow-x-auto snap-mandatory snap-x">
                        {sorted.map((r) => {
                            const topCategory = getTopCategory(r);
                            const hasTime = r.prepTimeRange && typeof r.prepTimeRange.min === "number" && typeof r.prepTimeRange.max === "number";
                            const tags = r.tags ?? [];

                            return (
                                <Link
                                    key={r.id}
                                    href={`/${lang}/r/${r.slug}`}
                                    className="flex flex-col gap-1.5 w-7/8 snap-start shrink-0"
                                >
                                    <div className="relative w-full h-auto font-semibold">
                                        <OnImageItems
                                            tags={tags}
                                            discount={r.highestPercentageDiscount !== undefined ? { type: "percentage", value: r.highestPercentageDiscount } : undefined}
                                            maxVisible={{
                                                withQuantity: 1,
                                                regular: 2
                                            }}
                                        />
                                        <Image
                                            src={r.picture.src}
                                            alt={r.picture.alt || r.name}
                                            width={1690}
                                            height={840}
                                            className="bg-card rounded-lg w-full object-cover aspect-[1690/840]"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center gap-2 px-1">
                                        <h3 className="flex justify-start items-center font-bold text-center">{r.name}</h3>
                                        {hasTime && (
                                            <PrimitiveTag
                                                Icon={Clock}
                                                text={`${r.prepTimeRange!.min}-${r.prepTimeRange!.max} min`}
                                                textColor="text-muted-foreground"
                                                backgroundColor="bg-transparent"
                                            />
                                        )}
                                    </div>
                                    {topCategory?.name && (
                                        <p className="px-1 text-muted-foreground text-sm/4 line-clamp-2">{topCategory.name}</p>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </>
            )}
        </section>
    );
}

type RestaurantSkeletonProps = {
    variant?: "primary" | "secondary"
}

export function RestaurantsSkeleton(
    {
        variant = "primary",
    } : RestaurantSkeletonProps
) {
    return (
        <section className="flex flex-col gap-4 w-full">
            <SectionsTitleSkeleton />
            { variant === "primary" && (
                <>
                    <div className="gap-4 grid grid-cols-2 w-full">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="flex flex-col gap-1.5 col-span-1">
                                <Skeleton className="rounded-lg w-full aspect-[865/560]" />
                                <div className="flex flex-col gap-1 px-1">
                                    <Skeleton className="rounded w-3/4 h-4" />
                                    <div className="flex items-center gap-1">
                                        <Skeleton className="size-4"/>
                                        <Skeleton className="rounded w-14 h-4" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-4 w-full overflow-x-hidden">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex flex-col gap-1.5 w-2/5 shrink-0">
                                <Skeleton className="rounded-lg w-full aspect-[650/480]" />
                                <div className="flex flex-col items-center gap-0.5">
                                    <Skeleton className="rounded w-3/4 h-4" />
                                    <Skeleton className="rounded w-1/2 h-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
            {variant === "secondary" && (
                <>
                    <div className="flex justify-start items-start gap-4 w-full overflow-x-hidden">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="flex flex-col gap-1.5 w-7/8 shrink-0">
                                <Skeleton className="rounded-lg w-full aspect-[1690/840]" />
                                <div className="flex flex-col gap-1.5 px-1">
                                    <div className="flex justify-between items-center gap-2">
                                        <Skeleton className="rounded w-1/3 h-6" />
                                        <div className="flex items-center gap-1">
                                            <Skeleton className="size-4"/>
                                            <TagSkeleton />
                                        </div>
                                    </div>
                                    <Skeleton className="rounded w-1/4 h-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}