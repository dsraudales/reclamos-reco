import { NextResponse, type NextRequest } from "next/server";

import { hasAdminAccess } from "@/lib/admin-access";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { response, user } = await updateSession(request);

  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname === "/admin/login";

  if (!isAdminRoute) {
    return response;
  }

  if (!user && !isLoginRoute) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (user && !hasAdminAccess(user) && !isLoginRoute) {
    return NextResponse.redirect(
      new URL("/admin/login?error=no_access", request.url),
    );
  }

  if (user && hasAdminAccess(user) && isLoginRoute) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
