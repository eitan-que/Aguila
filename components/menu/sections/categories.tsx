import Image from "next/image";
import Link from "next/link";
import SectionsTitle, { SectionsTitleSkeleton } from "@/components/menu/sections/sectionsTitle";
import { Skeleton } from "@/components/ui/skeleton";
import { Category } from "@/components/menu/sections/category";

type AnchorRef = { originalId: string; anchorId: string };

type CategoriesProps = {
  sectionTitle: {
    title: string;
    viewAll: { label: string };
  };
  lang: string;
  categories: Category[];
  isFromRestaurant?: boolean;
  anchors?: AnchorRef[]; // nuevo
};

export default function Categories({
  sectionTitle,
  lang,
  categories,
  isFromRestaurant,
  anchors,
}: CategoriesProps) {
  if (!categories?.length) return null;

  const sorted = [...categories].sort((a, b) => b.weight - a.weight);

  const anchorMap = new Map(
    (anchors || []).map(a => [a.originalId, a.anchorId])
  );

  return (
    <section className="flex flex-col gap-4 w-full">
      <SectionsTitle
        title={sectionTitle.title}
        viewAll={
          !isFromRestaurant
            ? {
                url: `/${lang}/c`,
                label: sectionTitle.viewAll.label,
              }
            : undefined
        }
      />
      <div className="flex gap-4 overflow-x-auto snap-mandatory snap-x">
        {sorted.map((cat, idx) => {
          const anchorId =
            isFromRestaurant
              ? (anchorMap.get(cat.id) || `${cat.id}-${idx}`)
              : cat.id;
          return (
            <Link
              key={`${cat.id}-${idx}`}
              href={
                isFromRestaurant
                  ? `#${anchorId}`
                  : `/${lang}/c/${cat.id}`
              }
              className="flex items-center gap-3 bg-card shadow-xs px-4 py-2 rounded-lg h-auto align-middle snap-start shrink-0"
            >
              <Image
                src={cat.icon.src}
                alt={cat.icon.alt || cat.name}
                width={40}
                height={40}
                className="bg-card rounded size-10 object-cover aspect-square"
              />
              <span className="h-auto text-sm/4">{cat.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function CategoriesSkeleton() {
  return (
    <section className="flex flex-col gap-4 w-full">
      <SectionsTitleSkeleton />
      <div className="flex gap-4 overflow-x-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton className="w-48 h-14 shrink-0" key={i} />
        ))}
      </div>
    </section>
  );
}