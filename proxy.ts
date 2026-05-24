import { NextResponse, type NextRequest } from "next/server";
import { decrypt } from "@/lib/session";

const ADMIN_PREFIX = "/admin";
const STAFF_PREFIX = "/staff";
const SIGNIN_PATH = "/sign-in";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("session")?.value;
  const session = await decrypt(token);

  const isProtected =
    pathname.startsWith(ADMIN_PREFIX) || pathname.startsWith(STAFF_PREFIX);

  if (isProtected && !session) {
    const url = req.nextUrl.clone();
    url.pathname = SIGNIN_PATH;
    return NextResponse.redirect(url);
  }

  if (session) {
    if (pathname.startsWith(ADMIN_PREFIX) && session.role !== "admin") {
      const url = req.nextUrl.clone();
      url.pathname = "/staff";
      return NextResponse.redirect(url);
    }
    if (pathname.startsWith(STAFF_PREFIX) && session.role !== "staff") {
      const url = req.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
    if (pathname === SIGNIN_PATH || pathname === "/") {
      const url = req.nextUrl.clone();
      url.pathname = session.role === "admin" ? "/admin" : "/staff";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/sign-in",
    "/admin/:path*",
    "/staff/:path*",
  ],
};
