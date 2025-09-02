import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import OnImageItems from "../primitives/onImageItems";

type BannerProps = {
    imageUrl: string;
    restaurant?: {
        name?: string;
        location?: string;
        coordinates?: {
            lat: number;
            lon: number;
        };
        prepTimeRange: {
            min: number;
            max: number;
        };
        tags: string[];
    }
}

export default function Banner({imageUrl, restaurant}: BannerProps) {
    let distance: string | undefined;
    
    if (restaurant && restaurant.coordinates) {
        // distance = calculateDistance(restaurant.coordinates);
        distance = "700m"
    }
    
    return (
        <div className="relative bg-card rounded-lg w-full h-auto aspect-video overflow-hidden shrink-0">
            <Image 
                src={imageUrl}
                alt="Restaurant Banner"
                fill
                priority
                className="w-full h-auto object-cover" 
            />
            {restaurant && (
                <>
                    <div className="absolute inset-0 pointer-events-none">
                        {/* Opción 2 (recomendada): gradiente para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                    </div>
                    <div className="absolute flex w-full h-full">
                        <div className="flex flex-col justify-end p-4 w-full h-full text-white">
                            <p className="font-semibold text-lg">{restaurant.name}</p>
                            <p className="text-sm">{restaurant.location} - {distance}</p>
                        </div>
                        <div className="relative w-full h-full">
                            <OnImageItems
                                tags={restaurant.tags.map(t => ({
                                    type: "text",
                                    text: t
                                }))}
                                maxVisible={{
                                    withQuantity: 4,
                                    regular: 4
                                }}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export function BannerSkeleton() {
    return (
        <Skeleton className="rounded-lg w-full h-auto aspect-video shrink-0" />
    );
}