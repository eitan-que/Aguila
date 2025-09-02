import { Skeleton } from "@/components/ui/skeleton";
import { Clock, LucideIcon, MapPin } from "lucide-react";

type PrimitiveTagProps = {
    text: string;
    Icon?: LucideIcon;
    textColor: string;
    backgroundColor: string;
};

export function PrimitiveTag({ Icon, text, textColor, backgroundColor }: PrimitiveTagProps) {
    return (
        <div className={`flex items-center gap-1 rounded-full w-max text-xs/4 ${backgroundColor} ${textColor} ${backgroundColor === "bg-transparent" ? "p-0" : Icon ? "pl-1.5 pr-2 py-1" : "px-2 py-1"}`}>
            {Icon && <Icon className="size-4" />}
            <span>{text}</span>
        </div>
    );
}

export function TagSkeleton() {
    return (
        <Skeleton className="rounded-full w-20 h-6" />
    );
}

type Tag = {
    type: "discount" | "time" | "distance" | "text";
    discount?: Discount;
    text?: string;
    time?: number;
    distance?: number;
}

type Discount = {
    type: "percentage" | "fixed";
    value: number;
}

export default function TagComponent({ tag }: { tag: Tag }) {
    switch (tag.type) {
        case "discount":
            return (
                <PrimitiveTag
                    text={`${tag.discount?.type === "fixed" ? "$" : ""}${tag.discount?.value}${tag.discount?.type === "percentage" ? "%" : ""} OFF`}
                    textColor="text-[#171717]"
                    backgroundColor="bg-[#fde047]"
                />
            );
        case "time":
            return (
                <PrimitiveTag
                    Icon={Clock}
                    text={`${tag.time} min`}
                    textColor="text-white"
                    backgroundColor="bg-[#10b981]"
                />
            );
        case "distance":
            return (
                <PrimitiveTag
                    Icon={MapPin}
                    text={`${tag.distance} km`}
                    textColor="text-white"
                    backgroundColor="bg-[#10b981]"
                />
            );
        case "text":
            return (
                <PrimitiveTag
                    text={`${tag.text}`}
                    textColor="text-white"
                    backgroundColor="bg-[#b91c1c]"
                />
            );
        default:
            return null;
    }
}