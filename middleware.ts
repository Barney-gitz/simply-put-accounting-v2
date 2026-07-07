import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "simply_put_session";

export function middleware(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE_NAME);

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/clients/:path*", "/administration/:path*"],
};