"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import DiscountBanner from "@/components/menu/primitives/discountBanner";
import { Skeleton } from "@/components/ui/skeleton";

type DiscountBannersProps = {
  discounts: {
    id: string;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    imageAlt?: string | null;
    restaurantId?: string | null;
    restaurantSlug?: string | null;
  }[];
  asLinkToRestaurant?: boolean;
};

export default function DiscountBanners({
  discounts,
  asLinkToRestaurant = false,
}: DiscountBannersProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const count = discounts.length;

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const container = containerRef.current;
      if (!container || count === 0) return;

      const clamped = ((index % count) + count) % count;

      const child = container.children.item(clamped) as HTMLElement | null;
      if (child) {
        // Solo desplazamiento horizontal
        const left = child.offsetLeft; // container es relative, los hijos directos usan este offset
        container.scrollTo({ left, behavior });
      } else {
        const approxLeft = clamped * container.clientWidth;
        container.scrollTo({ left: approxLeft, behavior });
      }
      setCurrentIndex(clamped);
    },
    [count]
  );

  // Auto-advance cada 5s (solo X)
  useEffect(() => {
    if (count <= 1) return;
    const id = window.setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % count;
        const container = containerRef.current;
        if (container) {
          const child = container.children.item(next) as HTMLElement | null;
          const left = child ? child.offsetLeft : next * container.clientWidth;
          container.scrollTo({ left, behavior: "smooth" });
        }
        return next;
      });
    }, Math.random() * 2000 + 3000); // entre 3 y 5 segundos
    return () => window.clearInterval(id);
  }, [count]);

  // Actualiza el índice activo según el scroll del contenedor
  const scrollDebounceRef = useRef<number | null>(null);
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (scrollDebounceRef.current) {
      window.clearTimeout(scrollDebounceRef.current);
    }
    scrollDebounceRef.current = window.setTimeout(() => {
      const { scrollLeft } = container;
      let bestIndex = 0;
      let bestDelta = Number.POSITIVE_INFINITY;

      Array.from(container.children).forEach((el, idx) => {
        const left = (el as HTMLElement).offsetLeft;
        const delta = Math.abs(left - scrollLeft);
        if (delta < bestDelta) {
          bestDelta = delta;
          bestIndex = idx;
        }
      });

      setCurrentIndex(bestIndex);
    }, 100);
  }, []);

  if (count === 0) {
    return null;
  }

  return (
    <section className="relative flex flex-col gap-2 w-full">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        // Permitir scroll vertical en la página aunque el mouse esté sobre el carrusel
        className="relative flex justify-start items-start gap-4 w-full overflow-x-auto overflow-y-visible overscroll-y-none snap-mandatory snap-x"
        style={{ overflowAnchor: "none" }}
      >
        {discounts.map((discount) => (
          <div key={discount.id} className="w-full snap-start shrink-0">
            <DiscountBanner
              discount={discount}
              asLinkToRestaurant={asLinkToRestaurant}
            />
          </div>
        ))}
      </div>

      <div className="bottom-2 absolute flex justify-center items-center w-full">
        <div className="flex justify-center items-center gap-1 bg-white/25 p-1 rounded-full">
          {discounts.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Ir al banner ${idx + 1}`}
              onClick={() => scrollToIndex(idx)}
              className={`rounded-full h-2 transition-all ${
                idx === currentIndex ? "bg-white w-6" : "bg-white/50 w-2"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function DiscountBannersSkeleton() {
  return (
    <section className="flex flex-col gap-4 w-full">
      <div className="flex justify-start items-start gap-4 w-full overflow-hidden">
        <Skeleton className="rounded-lg w-full h-auto aspect-video shrink-0" />
      </div>
    </section>
  );
}