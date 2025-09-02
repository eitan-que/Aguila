import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

type SectionTitleProps = {
    title: string;
    viewAll?: {
        url?: string;
        label?: string;
    }
};

export default function SectionsTitle(
    { title, viewAll }: SectionTitleProps
) {
    return (
        <div className={`flex ${viewAll ? "justify-between" : "justify-start"} items-center w-full`}>
            <h2 className="font-bold text-xl/6">{title}</h2>
            {viewAll && (
                <Link href={viewAll.url || "#"} className="text-muted-foreground text-sm/4 hover:underline hover:underline-offset-4">
                    {viewAll.label || "View All"}
                </Link>
            )}
        </div>
    );
}

export function SectionsTitleSkeleton({noLink}: {noLink?: boolean}) {
    return (
        <div className="flex justify-between items-center w-full">
            <Skeleton className="rounded w-2/5 h-6" />
            {noLink !== undefined ? null : <Skeleton className="rounded w-16 h-4" />}
        </div>
    );
}