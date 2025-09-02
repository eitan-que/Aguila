import { Lang } from "@/actions/dictionaries";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";
import Link from "next/link";

export type NavbarItemProps = {
    icon: LucideIcon;
    label: string;
    url: `/${Lang}/` | `/${Lang}/${string}/${string}/` | `/${Lang}/${string}/`;
    isActive?: boolean;
};

export default function NavbarItem(
    { icon, label, url, isActive }: NavbarItemProps
) {
    const IconComponent = icon;
    return (
        <Link
            href={url}
            className={`flex flex-col justify-center items-center gap-0.5 ${isActive ? "bg-primary hover:bg-primary/50 text-primary-foreground" : "hover:bg-accent/50 text-card-foreground"} p-2 rounded-lg w-18 h-18 aspect-square`}
        >
            <IconComponent className="w-6 h-6" />
            <span className="text-sm">{label}</span>
        </Link>
    );
}

export function NavbarItemSkeleton() {
    return (
        <div className="flex flex-col justify-center items-center gap-1 p-2 rounded-lg w-18 h-18 aspect-square">
            <Skeleton className="rounded w-6 h-6" />
            <Skeleton className="w-12 h-4" />
        </div>
    );
}