"use client";
import { Ref, useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, ChevronLeft, Search } from "lucide-react";
import Link from "next/link";
import { Lang } from "@/actions/dictionaries";

type HeaderProps = {
    ref?: Ref<HTMLElement>;
    lang: string;
    restaurant?: string;
    title?: string;
    variant?: "default" | "sticky";
    backUrl?: `/${Lang}/` | `/${Lang}/${string}/`;
    searchFilter?: string;
};

function HeaderComponent(
    { ref, lang, title, variant="default", backUrl, searchFilter }: HeaderProps
) {
    return (
        <header ref={ref || undefined} className={`flex justify-between items-center w-full ${variant === "sticky" ? "py-5 px-4 bg-card shadow-xs rounded-b-2xl border-b-2 border-background" : ""}`}>
            {backUrl && (
                <Link 
                href={backUrl}
                className={`relative ${variant === "sticky" ? "p-2" : "p-3"} h-auto aspect-square text-muted-foreground hover:text-card-foreground transition-colors duration-150`}>
                    <ChevronLeft className={`${variant === "sticky" ? "size-5" : "size-6"}`} />
                </Link>
            )}
            <h1 className={`font-bold ${variant === "sticky" ? "text-xl/6" : "text-[1.75rem]/10"}`}>{title || "Aguila"}</h1>
            <div className="flex gap-3">
                {searchFilter && (
                    <Link 
                        href={`/${lang}/search?${searchFilter}`}
                        className={`relative ${variant === "sticky" ? "p-2" : "p-3"} h-auto aspect-square text-muted-foreground hover:text-card-foreground transition-colors duration-150`}>
                        <Search className={`${variant === "sticky" ? "size-5" : "size-6"}`} />
                    </Link>
                )}
            </div>
        </header>
    );
}

export default function Header(props: HeaderProps) {
    const headerRef = useRef<HTMLElement | null>(null);
    const [showSticky, setShowSticky] = useState(false);
    const [isOutOfView, setIsOutOfView] = useState(false);

    const lastScrollY = useRef(0);
    const scrollDir = useRef<"up" | "down">("down");
    const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const DELAY = 180; // ms después de dejar de scrollear

    useEffect(() => {
        const el = headerRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsOutOfView(!entry.isIntersecting);
                // Si vuelve al top, ocultar sticky
                if (entry.isIntersecting) setShowSticky(false);
            },
            { root: null, threshold: 0.5 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        function onScroll() {
            const y = window.scrollY;
            const dir: "up" | "down" = y > lastScrollY.current ? "down" : "up";
            if (dir !== scrollDir.current) scrollDir.current = dir;
            lastScrollY.current = y;

            // Mientras se scrollea hacia abajo, ocultar (para evitar parpadeos)
            if (dir === "down") {
                if (showSticky) setShowSticky(false);
            } else if (dir === "up") {
                // Si sube y está fuera de vista, mostrar inmediatamente
                if (isOutOfView && !showSticky) setShowSticky(true);
            }

            // Reiniciar timer de "stop scrolling"
            if (stopTimer.current) clearTimeout(stopTimer.current);
            stopTimer.current = setTimeout(() => {
                // Solo mostramos si: fuera de vista + venía scrolleando hacia abajo
                if (isOutOfView && scrollDir.current === "down") {
                    setShowSticky(true);
                }
            }, DELAY);
        }

        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", onScroll);
            if (stopTimer.current) clearTimeout(stopTimer.current);
        };
    }, [isOutOfView, showSticky]);

    return (
        <>
            <HeaderComponent ref={headerRef} lang={props.lang} restaurant={props?.restaurant} title={props?.title || undefined} backUrl={props?.backUrl || undefined} searchFilter={props?.searchFilter || undefined} />
            <div
                aria-hidden={!showSticky}
                className={`
                    fixed top-0 left-0 right-0 z-40 transition-transform duration-300
                    ${showSticky
                        ? "translate-y-0 pointer-events-auto"
                        : "-translate-y-full pointer-events-none"
                    }`}
            >
                <HeaderComponent lang={props.lang} restaurant={props?.restaurant} variant="sticky" title={props?.title || undefined} backUrl={props?.backUrl || undefined} searchFilter={props?.searchFilter || undefined} />
            </div>
        </>
    );
}

export function HeaderSkeleton({ backButton }: { backButton?: boolean }) {
    return (
        <header className="flex justify-between items-center w-full">
            {backButton && (
                <div className="p-2">
                    <Skeleton className="w-8 h-8" />
                </div>
            )}
            <Skeleton className="w-48 h-10"/>
            <div className="flex gap-3">
                {Array.from({ length: 1 }).map((_, i) => (
                    <div key={i} className="p-2">
                        <Skeleton className="w-8 h-8" />
                    </div>
                ))}
            </div>
        </header>
    );
}