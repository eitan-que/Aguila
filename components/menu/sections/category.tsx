import SectionsTitle, { SectionsTitleSkeleton } from "@/components/menu/sections/sectionsTitle";
import ProductCard, { Product, ProductCardSkeleton } from "@/components/menu/primitives/productCard";

type CategoryProps = {
    lang: string;
    variant?: "medium" | "large" | "grid" | "list";
    category: Category;
    bestSellerLabel?: string;
    addToCartButtons?: boolean;
    anchorId?: string; // nuevo
};

export type Category = {
    id: string;
    name: string;
    picture: {
      src: string;
      alt: string;
    };
    icon: {
      src: string;
      alt: string;
    };
    weight: number;
    products: Product[];
};

export default function Category(
  {
    lang,
    variant = "medium",
    category,
    bestSellerLabel,
    addToCartButtons,
    anchorId,
  }: CategoryProps
) {
  if (!category || category.products.length === 0) return null;
  const products = category.products || [];

  return (
    <section
      className="flex flex-col gap-4 w-full scroll-mt-19.5"
      id={anchorId || category.id}  // anchor único
    >
      <SectionsTitle title={category.name} />
      {variant === "medium" && (
        <div className="flex justify-start items-start gap-4 w-full overflow-x-auto snap-mandatory snap-x">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              lang={lang}
              variant="medium"
              product={p}
              isBestSeller={typeof p.rating === "number" && p.rating > 4}
              bestSellerLabel={bestSellerLabel}
              addToCartButton={addToCartButtons}
            />
          ))}
        </div>
      )}
      {variant === "large" && (
        <div className="flex justify-start items-start gap-4 w-full overflow-x-auto snap-mandatory snap-x">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              lang={lang}
              variant="large"
              product={p}
              isBestSeller={typeof p.rating === "number" && p.rating > 4}
              bestSellerLabel={bestSellerLabel}
              addToCartButton={addToCartButtons}
            />
          ))}
        </div>
      )}
      {variant === "grid" && (
        <div className="gap-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 w-full">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              lang={lang}
              variant="grid"
              product={p}
              isBestSeller={typeof p.rating === "number" && p.rating > 4}
              bestSellerLabel={bestSellerLabel}
              addToCartButton={addToCartButtons}
            />
          ))}
        </div>
      )}
      {variant === "list" && (
        <div className="flex flex-col justify-start items-start gap-4 w-full">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              lang={lang}
              variant="list"
              product={p}
              isBestSeller={typeof p.rating === "number" && p.rating > 4}
              bestSellerLabel={bestSellerLabel}
              addToCartButton={addToCartButtons}
            />
          ))}
        </div>
      )}
    </section>
  );
}

type CategorySkeletonProps = {
  variant?: "medium" | "large" | "grid" | "list";
};

export function CategorySkeleton({ variant = "medium" }: CategorySkeletonProps) {
  return (
    <section className="flex flex-col gap-4 w-full">
      <SectionsTitleSkeleton noLink={true} />
      {variant === "medium" && (
        <div className="flex justify-start items-start gap-4 w-full overflow-x-hidden">
          {Array.from({ length: 2 }).map((_, i) => (
            <ProductCardSkeleton variant="medium" key={i} />
          ))}
        </div>
      )}
      {variant === "large" && (
        <div className="flex justify-start items-start gap-4 w-full overflow-x-hidden">
          {Array.from({ length: 2 }).map((_, i) => (
            <ProductCardSkeleton variant="large" key={i} />
          ))}
        </div>
      )}
      {variant === "grid" && (
        <div className="gap-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 w-full">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton variant="grid" key={i} />
          ))}
        </div>
      )}
      {variant === "list" && (
        <div className="flex flex-col justify-start items-start gap-4 w-full">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton variant="list" key={i} />
          ))}
        </div>
      )}
    </section>
  );
}