import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

type SearchbarProps = {
    placeholder: string;
};

export default function Searchbar(
    { placeholder }: SearchbarProps
) {
    return (
        <search className="relative flex items-center bg-input shadow-xs p-0 rounded-lg w-full h-auto">
            <input type="search" placeholder={placeholder} className="p-4 focus:outline-none w-full h-auto placeholder:text-muted text-sm/4 truncate" />
            <div className="p-4 size-auto text-muted-foreground">
                <Search className="size-6" />
            </div>
        </search>
    );
}

export function SearchbarSkeleton() {
    return (
        <Skeleton className="rounded-lg w-full h-14" />
    );
}