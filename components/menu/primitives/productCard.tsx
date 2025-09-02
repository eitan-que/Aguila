"use client";
import Image from "next/image";
import Link from "next/link";
import OnImageItems from "@/components/menu/primitives/onImageItems";
import { Skeleton } from "@/components/ui/skeleton";

type ProductCardVariant = "medium" | "large" | "grid" | "list";

type ProductCardProps = {
  lang: string;
  variant?: ProductCardVariant;
  product: Product;
  isBestSeller?: boolean;
  bestSellerLabel?: string;
  addToCartButton?: boolean;
};

export type Product = {
  id: string;
  name: string;
  description?: string;
  picture: {
    src: string;
    alt: string;
  };
  price: number;
  discount?: Discount;
  tags?: ProductTag[];
  rating?: number;
};

type ProductTag = {
  type: "text";
  text?: string;
};

type Discount = {
  type: "percentage" | "fixed";
  value: number;
};

/**
 * Apply discount to a price
 */
export const applyDiscount = (price: number, discount: Discount) => {
  const { type, value } = discount;
  if (type === "percentage") {
    return price - (price * value) / 100;
  } else if (type === "fixed") {
    return price - value;
  }
  return price;
};

const handleModifyQuantity = (quantity: number, product: Product) => {
  console.log(`There are ${quantity} of ${product.name} in the cart.`);
};

/**
 * Config central por variante (verticales).
 * Para agregar una nueva variante vertical reutilizando layout,
 * añade una entrada aquí.
 */
const verticalVariantConfig: Record<
  Exclude<ProductCardVariant, "list">,
  {
    linkClass: string;
    image: {
      width: number;
      height: number;
      aspectClass: string; // clase completa tailwind
      placeholder: string;
    };
  }
> = {
  medium: {
    linkClass: "flex flex-col gap-1.5 shrink-0 w-4/7 snap-start",
    image: {
      width: 945,
      height: 720,
      aspectClass: "aspect-[945/720]",
      placeholder: "https://placehold.co/945x720/png",
    },
  },
  large: {
    linkClass: "flex flex-col gap-1.5 w-3/4 shrink-0 snap-start",
    image: {
      width: 1340,
      height: 980,
      aspectClass: "aspect-[1340/980]",
      placeholder: "https://placehold.co/1340x980/png",
    },
  },
  grid: {
    linkClass: "flex flex-col gap-1.5 w-full snap-start",
    image: {
      width: 945,
      height: 720,
      aspectClass: "aspect-[945/720]",
      placeholder: "https://placehold.co/945x720/png",
    },
  },
};

function PriceBlock({
  finalPrice,
  original,
}: {
  finalPrice: number;
  original: number;
}) {
  const showDiscount = finalPrice < original;
  return (
    <div className="flex justify-start items-start gap-1 px-1">
      <h3 className="flex items-center font-bold text-center">${finalPrice}</h3>
      {showDiscount && (
        <p className="flex items-center font-bold text-muted-foreground text-sm/6 text-center line-through">
          ${original}
        </p>
      )}
    </div>
  );
}

function VerticalVariantCard(props: {
  variant: Exclude<ProductCardVariant, "list">;
  product: Product;
  lang: string;
  finalPrice: number;
  addToCartButton?: boolean;
}) {
  const { variant, product, lang, finalPrice, addToCartButton } = props;
  const cfg = verticalVariantConfig[variant];

  return (
    <Link
      key={product.id}
      href={`/${lang}/p/${product.id}`}
      className={cfg.linkClass}
    >
      <div className="relative w-full h-auto font-semibold">
        <OnImageItems
          tags={product.tags}
          discount={product.discount}
          maxVisible={{ withQuantity: 1, regular: 2 }}
          modifyQuantity={
            addToCartButton
              ? (quantity) => handleModifyQuantity(quantity, product)
              : undefined
          }
        />
        <Image
          src={product.picture.src || cfg.image.placeholder}
          alt={product.picture?.alt || product.name || "Producto"}
          width={cfg.image.width}
          height={cfg.image.height}
          className={`rounded-lg w-full object-cover bg-card ${cfg.image.aspectClass}`}
        />
      </div>
      <div className="flex flex-col w-full h-auto">
        <PriceBlock finalPrice={finalPrice} original={product.price} />
        <p className="px-1 text-muted-foreground text-sm/5 line-clamp-2">
            {product.name}
        </p>
      </div>
    </Link>
  );
}

export default function ProductCard({
  lang,
  variant = "medium",
  product,
  isBestSeller,
  bestSellerLabel,
  addToCartButton,
}: ProductCardProps) {
  const finalPrice = product.discount
    ? applyDiscount(product.price, product.discount)
    : product.price;

  // Variantes verticales reutilizan mismo layout
  if (variant !== "list") {
    return (
      <VerticalVariantCard
        variant={variant}
        product={product}
        lang={lang}
        finalPrice={finalPrice}
        addToCartButton={addToCartButton}
      />
    );
  }

  // Variante list (layout distinto)
  return (
    <Link
      key={product.id}
      href={`/${lang}/p/${product.id}`}
      className="flex justify-between items-center gap-4 w-full snap-start"
    >
      <div className="flex flex-col justify-center gap-1.5 py-2 w-full">
        {isBestSeller && (
          <p className="text-[#16A34A] dark:text-[#4ade80] text-sm/4 line-clamp-1">
            {bestSellerLabel || "Best seller"}
          </p>
        )}
        <p
          className={`font-semibold sm:text-lg text-foreground ${
            bestSellerLabel
              ? "line-clamp-1 sm:line-clamp-2"
              : "line-clamp-2 sm:line-clamp-4"
          }`}
        >
          {product.name}
        </p>
        {product.description && (
          <p className="text-muted-foreground sm:text-[1rem] text-sm/5 line-clamp-2 sm:line-clamp-4">
            {product.description}
          </p>
        )}
        <div className="flex justify-start items-start gap-1">
          <h3 className="flex items-center font-bold text-center">
            ${finalPrice}
          </h3>
          {finalPrice < product.price && (
            <p className="flex items-center font-bold text-muted-foreground text-sm/6 text-center line-through">
              ${product.price}
            </p>
          )}
        </div>
      </div>
      <div className="relative w-2/5 min-w-36 h-full font-semibold">
        <OnImageItems
          // tags={product.tags} // si quieres mostrar tags aquí, descomenta
          discount={product.discount}
          maxVisible={{ withQuantity: 1, regular: 2 }}
          modifyQuantity={
            addToCartButton
              ? (quantity) => handleModifyQuantity(quantity, product)
              : undefined
          }
        />
        <Image
          src={product.picture.src}
          alt={product.picture?.alt || product.name || "Producto"}
          width={720}
          height={640}
          className="bg-card rounded-lg w-full object-cover aspect-[720/640]"
        />
      </div>
    </Link>
  );
}

function VerticalVariantCardSkeleton({
  cfg,
}: {
  cfg: {
    linkClass: string;
    image: {
      aspectClass: string;
    };
  };
}) {
  return (
    <div className={cfg.linkClass}>
      <Skeleton className={`rounded-lg w-full ${cfg.image.aspectClass}`} />
      <div className="flex flex-col gap-1 px-1">
        <div className="flex gap-1">
          <Skeleton className="rounded w-24 h-6" />
          <Skeleton className="rounded w-20 h-6" />
        </div>
        <Skeleton className="rounded w-4/5 max-w-48 h-4" />
      </div>
    </div>
  );
}

export function ProductCardSkeleton({
  variant = "medium",
}: {
  variant?: ProductCardVariant;
}) {
  const cfg =
    variant !== "list"
      ? verticalVariantConfig[variant as Exclude<ProductCardVariant, "list">]
      : null;

  if (variant !== "list" && cfg) {
    return (
      <VerticalVariantCardSkeleton cfg={cfg} />
    );
  }

  // Variante list (layout distinto)
  return (
    <div className="flex justify-between items-center gap-4 w-full">
      <div className="flex flex-col gap-1.5 py-2 w-full">
        <Skeleton className="rounded w-24 h-4" />
        <Skeleton className="rounded w-32 h-6" />
        <Skeleton className="rounded w-full h-4" />
        <Skeleton className="rounded w-3/4 h-4" />
        <div className="flex gap-1">
            <Skeleton className="rounded w-24 h-6" />
            <Skeleton className="rounded w-20 h-6" />
        </div>
      </div>
      <Skeleton className="rounded-lg w-2/5 min-w-36 h-full aspect-[720/640]" />
    </div>
  );
}