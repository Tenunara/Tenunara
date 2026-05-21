import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const SELLER_ONLY_PATHS = ["/dashboard/listings", "/dashboard/listings/new"];
const BUYER_ONLY_PREFIXES = ["/dashboard/browse", "/dashboard/search"];

function getRoleFromCookie(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.user_metadata?.role ?? null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Refresh Supabase session cookies
  const response = await updateSession(request);

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    const hasAuthCookie = request.cookies.getAll().some((c) =>
      c.name.startsWith("sb-"),
    );

    if (!hasAuthCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based route protection
    const token = request.cookies.get("sb-access-token")?.value;
    if (token) {
      const role = getRoleFromCookie(token);

      // Seller-only paths → block pengrajin (buyer)
      if (role === "pengrajin" && SELLER_ONLY_PATHS.includes(pathname)) {
        return NextResponse.redirect(new URL("/dashboard/browse", request.url));
      }

      // Buyer-only prefixes → block umkm (seller)
      if (
        role === "umkm" &&
        BUYER_ONLY_PREFIXES.some((p) => pathname.startsWith(p))
      ) {
        return NextResponse.redirect(new URL("/dashboard/listings", request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
