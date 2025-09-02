import NavbarItem, { NavbarItemProps, NavbarItemSkeleton } from "./navbarItem";

type NavbarProps = {
    items: NavbarItemProps[];
};

export default function Navbar(
    { items }: NavbarProps
) {
    return (
        <>
            <div className="w-full h-19"/>
            <nav className="right-0 bottom-0 left-0 fixed flex justify-around items-ce bg-card shadow-xs p-4 border-t-2 border-background w-full h-auto font-semibold">
            {items.map((item, index) => (
                <NavbarItem
                    key={`${item.label}-${index}`}
                    icon={item.icon}
                    label={item.label}
                    url={item.url}
                    isActive={item.isActive}
                />
            ))}
            </nav>
        </>
    );
}

export function NavbarSkeleton() {
    return (
        <>
            <div className="w-full h-19"/>
            <nav className="right-0 bottom-0 left-0 fixed flex justify-around items-ce bg-card shadow-xs p-4 border-t-2 border-background w-full h-auto font-semibold">
            {Array.from({ length: 2 }).map((_, i) => (
                <NavbarItemSkeleton key={i} />
            ))}
            </nav>
        </>
    );
}