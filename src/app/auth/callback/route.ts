import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { syncUserFromAuth } from "@/lib/auth";

function getRedirectOrigin(request: Request) {
  const { origin } = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (process.env.NODE_ENV !== "development" && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  return origin;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const redirectOrigin = getRedirectOrigin(request);
  const successUrl = `${redirectOrigin}${next.startsWith("/") ? next : `/${next}`}`;
  const errorUrl = `${redirectOrigin}/sign-in?error=auth`;

  if (!code) {
    return NextResponse.redirect(errorUrl);
  }

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user?.email) {
      console.error("OAuth exchange failed:", error?.message);
      return NextResponse.redirect(errorUrl);
    }

    // Persist app user row, but never block login if DB sync fails.
    try {
      await syncUserFromAuth({
        email: data.user.email,
        name:
          data.user.user_metadata?.full_name ?? data.user.user_metadata?.name,
        image: data.user.user_metadata?.avatar_url,
      });
    } catch (syncError) {
      console.error("User sync failed after OAuth:", syncError);
    }

    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error("Auth callback crashed:", error);
    return NextResponse.redirect(errorUrl);
  }
}
