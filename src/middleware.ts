import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "academy_session";

const protectedPrefixes = ["/mi-cuenta", "/mis-cursos", "/admin"];
const guestOnlyPrefixes = ["/acceder", "/registro"];

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    return null;
  }

  return new TextEncoder().encode(secret);
}

async function hasValidSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const secret = getSessionSecret();

  if (!token || !secret) {
    return false;
  }

  try {
    const verified = await jwtVerify(token, secret);
    return typeof verified.payload.sub === "string";
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = await hasValidSession(request);

  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/acceder", request.url);
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  const isGuestOnly = guestOnlyPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isGuestOnly && isAuthenticated) {
    return NextResponse.redirect(new URL("/mi-cuenta", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/mi-cuenta/:path*",
    "/mis-cursos/:path*",
    "/admin/:path*",
    "/acceder",
    "/registro"
  ]
};
