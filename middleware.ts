import { NextResponse, NextRequest } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { locales } from "./actions/dictionaries";
import type { Lang } from "./actions/dictionaries";

const DEFAULT_LOCALE: Lang = "en";

function negotiateLocale(request: NextRequest): Lang {
  const accept = request.headers.get("accept-language") || "";
  const languages = new Negotiator({ headers: { "accept-language": accept } }).languages();
  const matched = match(languages, locales as string[], DEFAULT_LOCALE);
  return (matched.startsWith("es") ? "es" : "en") as Lang;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Early return for root path
  if (pathname === "/") {
    const locale = negotiateLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    return NextResponse.redirect(url);
  }

  // Extract first segment to check if it's a supported locale
  const segments = pathname.split("/").filter(Boolean);
  const candidate = segments[0] as Lang | undefined;
  const hasSupportedLocale = !!candidate && (locales as readonly string[]).includes(candidate);

  if (hasSupportedLocale) {
    // No auth checks in middleware - just handle locale routing
    return NextResponse.next();
  }

  // No valid locale → negotiate and redirect
  const locale = negotiateLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`.replace(/\/+$/, "") || `/${locale}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Match everything except static files and API routes
    "/((?!_next/static|_next/image|favicon.ico|api|apple-icon.png|icon0.png|icon1.png|manifest.json|sw.js).*)",
  ],
};

