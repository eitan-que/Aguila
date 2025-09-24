import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import Link from "next/link";

export default function DiscountBanner({discount, asLinkToRestaurant}: {discount: {
    id: string;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    imageAlt?: string | null;
    restaurantSlug?: string | null;
  };
  asLinkToRestaurant?: boolean;
}) {
    if (asLinkToRestaurant) {
        return (
          <Link href={`/r/${discount.restaurantSlug}`} className="relative flex rounded-lg w-full min-w-full aspect-video overflow-hidden snap-always snap-start select-none shrink-0">
            <Image
                src={discount.imageUrl || "https://placehold.co/1920x1080/png"}
                alt={discount.imageAlt || discount.name}
                fill
                sizes="100vw"
                className="object-cover hover:scale-105 transition-transform duration-300 ease-in-out transform"
                priority={false}
                draggable={false}
              />
            {(discount.name || discount.description) && (
                <div className="right-0 bottom-0 left-0 absolute flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent p-4 pb-7 w-full h-full text-white">
                    <h2 className="font-semibold text-lg">{discount.name}</h2>
                    {/* {discount.description && (
                        <p className="text-sm line-clamp-2">{discount.description}</p>
                    )} */}
                </div>
            )}
          </Link>
        )
    }

    return (
        <div
          key={discount.id}
          className="relative flex rounded-lg w-full min-w-full aspect-video overflow-hidden snap-always snap-start select-none shrink-0"
        >
            <Image
                src={discount.imageUrl || "https://placehold.co/1920x1080/png"}
                alt={discount.imageAlt || discount.name}
                fill
                sizes="100vw"
                className="object-cover hover:scale-105 transition-transform duration-300 ease-in-out transform"
                priority={false}
                draggable={false}
              />
            {(discount.name || discount.description) && (
                <div className="right-0 bottom-0 left-0 absolute flex flex-col justify-end bg-gradient-to-t from-card-foreground/70 to-transparent p-4 pb-7 w-full h-full text-card">
                    <h2 className="font-semibold text-lg">{discount.name}</h2>
                    {discount.description && (
                        <p className="text-sm line-clamp-2">{discount.description}</p>
                    )}
                </div>
            )}
        </div>
    );
}

export function BannerSkeleton() {
    return (
        <Skeleton className="rounded-lg w-full aspect-video shrink-0" />
    );
}