import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function externalOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host") || request.nextUrl.host;
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto = forwardedProto || request.nextUrl.protocol.replace(/:$/, "");
  return `${proto}://${host}`;
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get("lmc_token")?.value;
  const isLogin = request.nextUrl.pathname.startsWith("/login");
  const origin = externalOrigin(request);
  if (!token && !isLogin) {
    return NextResponse.redirect(new URL("/login", origin));
  }
  if (token && isLogin) {
    return NextResponse.redirect(new URL("/estudios", origin));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|icon.svg|favicon.ico).*)"],
};
