import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function appUrl(request: NextRequest, path: string): URL {
  const target = request.nextUrl.clone();
  target.pathname = path;
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwardedHost) {
    target.host = forwardedHost;
  }
  if (forwardedProto) {
    target.protocol = forwardedProto.endsWith(":") ? forwardedProto : `${forwardedProto}:`;
  }
  return target;
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get("lmc_token")?.value;
  const isLogin = request.nextUrl.pathname.startsWith("/login");
  const isLoginApi = request.nextUrl.pathname.startsWith("/api/login");
  if (!token && !isLogin && !isLoginApi) {
    return NextResponse.redirect(appUrl(request, "/login"));
  }
  if (token && isLogin) {
    return NextResponse.redirect(appUrl(request, "/estudios"));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|icon.svg|favicon.ico).*)"],
};
