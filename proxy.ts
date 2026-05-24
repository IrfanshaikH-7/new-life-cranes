import { NextResponse, type NextRequest } from "next/server";

const SIGNIN_PATH = "/sign-in";

/**
 * Lightweight JWT role extraction using the Web Crypto API.
 * Avoids importing jose/mongodb in the proxy hot path.
 * Returns the role claim from the payload, or null if invalid/missing.
 */
async function getRoleFromCookie(req: NextRequest): Promise<"admin" | "staff" | null> {
  const token = req.cookies.get("session")?.value;
  if (!token) return null;

  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Verify signature with HMAC-SHA256
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const signingInput = `${parts[0]}.${parts[1]}`;
    const signature = Uint8Array.from(
      atob(parts[2].replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0)
    );

    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      signature,
      new TextEncoder().encode(signingInput)
    );
    if (!valid) return null;

    // Decode payload
    const payloadJson = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson) as { role?: string; expiresAt?: number };

    // Check expiry
    if (payload.expiresAt && Date.now() > payload.expiresAt) return null;

    const role = payload.role;
    if (role === "admin" || role === "staff") return role;
    return null;
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const role = await getRoleFromCookie(req);

  const isAdmin = pathname.startsWith("/admin");
  const isStaff = pathname.startsWith("/staff");
  const isProtected = isAdmin || isStaff;

  // Not authenticated → sign-in
  if (isProtected && !role) {
    const url = req.nextUrl.clone();
    url.pathname = SIGNIN_PATH;
    return NextResponse.redirect(url);
  }

  if (role) {
    // Wrong role for the section
    if (isAdmin && role !== "admin") {
      const url = req.nextUrl.clone();
      url.pathname = "/staff";
      return NextResponse.redirect(url);
    }
    if (isStaff && role !== "staff") {
      const url = req.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
    // Already authenticated, redirect away from sign-in / root
    if (pathname === SIGNIN_PATH || pathname === "/") {
      const url = req.nextUrl.clone();
      url.pathname = role === "admin" ? "/admin" : "/staff";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/sign-in", "/admin/:path*", "/staff/:path*"],
};
