import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { type NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

const VERCEL_HOST = "robot-industry-atlas.vercel.app";
const PRODUCTION_HOST = "www.szrobotvalley.com";

export default function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";

  if (host === VERCEL_HOST) {
    const url = new URL(request.url);
    url.host = PRODUCTION_HOST;
    url.protocol = "https";
    return NextResponse.redirect(url, 308);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/", "/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
