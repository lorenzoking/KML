import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  COMMISSIONER_PREFIXES,
  PROTECTED_PREFIXES,
} from "@/lib/constants";

const APP_SESSION_COOKIE = "kml_app_session";
const DEV_SESSION_COOKIE = "kml_dev_user";

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const pathname = request.nextUrl.pathname;
  const hasAppSession = Boolean(
    request.cookies.get(APP_SESSION_COOKIE)?.value ||
      request.cookies.get(DEV_SESSION_COOKIE)?.value
  );

  const isAuthed = Boolean(user) || hasAppSession;
  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (needsAuth && !isAuthed) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  void COMMISSIONER_PREFIXES;

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/madden|api/league|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
