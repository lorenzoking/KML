import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/forms/submit-button";
import {
  devSignIn,
  listDevUsers,
  signInWithGoogle,
} from "@/actions/auth";
import { getSessionUser, isDevAuthEnabled } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  const params = await searchParams;
  const supabaseReady = isSupabaseConfigured();
  const devUsers = await listDevUsers();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Google OAuth for production. Demo login available when local bypass
            is enabled.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {params.error ? (
            <p className="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
              Sign-in failed. Check Supabase Google provider settings and try again.
            </p>
          ) : null}

          {supabaseReady ? (
            <form
              action={async () => {
                "use server";
                await signInWithGoogle();
              }}
            >
              <SubmitButton className="w-full" pendingText="Redirecting...">
                Continue with Google
              </SubmitButton>
            </form>
          ) : (
            <div className="rounded-md border border-dashed border-[var(--border)] p-3 text-sm text-[var(--muted-foreground)]">
              Supabase env vars are not configured yet. Use demo login below, or
              add your Supabase keys to enable Google OAuth.
            </div>
          )}
        </CardContent>
      </Card>

      {isDevAuthEnabled() ? (
        <Card>
          <CardHeader>
            <CardTitle>Demo login</CardTitle>
            <CardDescription>
              Local bypass for seeded users. Set <code>AUTH_DEV_BYPASS=false</code> in
              production.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {devUsers.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                No seeded users found. Run <code>npm run db:seed</code>.
              </p>
            ) : (
              devUsers.map((u) => (
                <form
                  key={u.id}
                  action={async () => {
                    "use server";
                    await devSignIn(u.id);
                  }}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {u.email}
                      {u.memberships[0]
                        ? ` · ${u.memberships[0].franchise.abbreviation}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{u.role}</Badge>
                    <Button type="submit" size="sm" variant="secondary">
                      Enter
                    </Button>
                  </div>
                </form>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
