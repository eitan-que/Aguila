import Link from "next/link";
import { Restaurant } from "../sections/restaurants";
import OnImageItems from "../primitives/onImageItems";
import Image from "next/image";
import { PrimitiveTag } from "../primitives/tag";
import { MapPin } from "lucide-react";

type Banner4ListProps = {
    lang: string;
    restaurant: Restaurant;
};

export default function Banner4List({
    lang,
    restaurant
}: Banner4ListProps) {
    const getTopCategory = (r: Restaurant) =>
        r.categories?.length
        ? r.categories.reduce((prev, cur) => (cur.weight > prev.weight ? cur : prev), r.categories[0])
        : undefined;
    const topCategory = getTopCategory(restaurant);
    const hasDistance = typeof restaurant.distanceKm === "number";
    const meters = typeof restaurant.distanceKm === "number" ? Math.round(restaurant.distanceKm * 1000) : undefined;
    const tags = restaurant.tags ?? [];
    return (
        <Link
            key={restaurant.id}
            href={`/${lang}/r/${restaurant.slug}`}
            className="flex flex-col gap-1.5 w-full snap-start shrink-0"
        >
            <div className="relative w-full h-auto font-semibold">
                <OnImageItems
                    tags={tags}
                    discount={restaurant.highestPercentageDiscount !== undefined ? { type: "percentage", value: restaurant.highestPercentageDiscount } : undefined}
                    maxVisible={{
                        withQuantity: 1,
                        regular: 2
                    }}
                />
                <Image
                    src={restaurant.picture.src}
                    alt={restaurant.picture.alt || restaurant.name}
                    width={1690}
                    height={840}
                    className="bg-card rounded-lg w-full object-cover aspect-[1690/840]"
                />
            </div>
            <div className="flex justify-between items-center gap-2 px-1">
                <h3 className="flex justify-start items-center font-bold text-center">{restaurant.name}</h3>
                {hasDistance && (
                    <PrimitiveTag
                        Icon={MapPin}
                        text={`${meters} m`}
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
}
