// Proxy (called "middleware" before Next.js 16) runs BEFORE a request reaches a page.
//
// This is only an *optimistic* check: "is there a session cookie at all?" If
// not, send the user to /login straight away. It does NOT verify the token. The
// real checks happen in lib/session.ts (requireUser / requireAdmin) and, above
// all, in the FastAPI backend.
import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("session");
  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    // Remember where the user wanted to go, so login can send them back.
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

// Only run the proxy for these paths. Public pages skip it entirely.
export const config = {
  matcher: ["/checkout", "/orders/:path*", "/admin/:path*"],
};
