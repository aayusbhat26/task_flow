import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";

const locales = ["te", "en"];
const defaultLocale = "en";
const publicPages = ["/", "/sign-in", "/sign-up"];
const oneYear = 60 * 60 * 24 * 365;

function detectLocale(req: NextRequest) {
  const cookie = req.cookies.get("NEXT_LOCALE")?.value;
  if (cookie && locales.includes(cookie)) return cookie;

  const accepted = req.headers.get("accept-language")?.toLowerCase() ?? "";
  for (const entry of accepted.split(",")) {
    const code = entry.trim().split(";")[0].split("-")[0];
    if (locales.includes(code)) return code;
  }
  return defaultLocale;
}

// Next's middleware response handling parses Location with `new URL(location)`,
// so redirects must be absolute. The request's internal origin is the bind
// address (localhost:3000 inside the container), so use the forwarded host.
function publicOrigin(req: NextRequest) {
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    req.nextUrl.host;
  const forwardedProto = req.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    .trim();
  const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const proto = forwardedProto || (isLocal ? "http" : "https");
  return `${proto}://${host}`;
}

function localeCookie(locale: string) {
  return {
    name: "NEXT_LOCALE",
    value: locale,
    path: "/",
    maxAge: oneYear,
    sameSite: "lax" as const,
  };
}

// No rewrite here on purpose: Next's standalone server turns rewrites into an
// internal fetch against its bind address, which fails behind the TLS proxy.
function handleLocale(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const locale = pathname.split("/")[1];

  if (!locales.includes(locale)) {
    const resolved = detectLocale(req);
    const target = `/${resolved}${pathname === "/" ? "" : pathname}${search}`;
    const response = NextResponse.redirect(
      new URL(target, publicOrigin(req)),
      307
    );
    response.cookies.set(localeCookie(resolved));
    return response;
  }

  const headers = new Headers(req.headers);
  headers.set("x-pathname", pathname);
  const response = NextResponse.next({ request: { headers } });
  response.cookies.set(localeCookie(locale));
  return response;
}

const authMiddleware = withAuth(
  function onSuccess(req) {
    return handleLocale(req);
  },
  {
    callbacks: {
      authorized: ({ token }) => token !== null,
    },
    pages: {
      signIn: "/sign-in",
    },
  }
);

// NextAuth builds redirects from the internal request URL, which is
// localhost:3000 inside the container. Swap in the public host.
function withPublicOrigin(response: NextResponse, req: NextRequest) {
  const location = response.headers.get("location");
  if (!location) return response;
  try {
    const url = new URL(location);
    if (["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(url.hostname)) {
      response.headers.set(
        "location",
        `${publicOrigin(req)}${url.pathname}${url.search}${url.hash}`
      );
    }
  } catch {
    // Leave unusable locations untouched.
  }
  return response;
}

export default async function middleware(req: NextRequest) {
  const publicPathnameRegex = RegExp(
    `^(/(${locales.join("|")}))?(${publicPages.join("|")})?/?$`,
    "i"
  );

  if (publicPathnameRegex.test(req.nextUrl.pathname)) {
    return handleLocale(req);
  }

  const response = await (authMiddleware(req) as Promise<NextResponse>);
  return withPublicOrigin(response, req);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
