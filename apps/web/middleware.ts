import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function appUrl(request: NextRequest, path: string): URL {
  const target = request.nextUrl.clone();
  target.pathname = path;
  return target;
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get("lmc_token")?.value;
  const isLogin = request.nextUrl.pathname.startsWith("/login");
  if (!token && !isLogin) {
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
