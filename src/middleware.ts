import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  COMMISSIONER_PREFIXES,
  PROTECTED_PREFIXES,
} from "@/lib/constants";

const DEV_SESSION_COOKIE = "kml_dev_user";

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const pathname = request.nextUrl.pathname;
  const hasDevSession =
    process.env.AUTH_DEV_BYPASS === "true" &&
    Boolean(request.cookies.get(DEV_SESSION_COOKIE)?.value);

  const isAuthed = Boolean(user) || hasDevSession;
  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (needsAuth && !isAuthed) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Commissioner role is enforced in server layouts/actions (needs DB).
  // Middleware only gates authentication for protected prefixes.
  void COMMISSIONER_PREFIXES;

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
